import { IDENTITY_SCOPES, PREFERENCES_CLAIM, PreferencesError, normalizePreferences, normalizeUserInfo, readIdentityJson } from './identity';
import type {
    UsersauConfig,
    UsersauUser,
    UsersauTokens,
    UsersauState,
    TokenResponse,
    InterfacePreferences,
    PreferenceChanges,
} from './types';
import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce';
import { TokenStorage } from './storage';

/**
 * UsersauClient — the core OAuth 2.0 PKCE client.
 *
 * Mirrors the PHP laravel-client AuthController:
 *   login()          → redirect()
 *   handleCallback() → callback()
 *   logout()         → logout()
 *   account()        → account()
 *   register()       → register()
 */
export class UsersauClient {
    private config: Required<
        Pick<UsersauConfig, 'afterLoginUrl' | 'afterLogoutUrl' | 'afterRegisterUrl' | 'scopes' | 'storage'>
    > &
        Pick<UsersauConfig, 'clientId' | 'host' | 'redirectUri'>;

    private storage: TokenStorage;
    private _state: UsersauState;
    private generation = 0;
    private preferenceWrites: Promise<unknown> = Promise.resolve();
    private refreshing?: Promise<UsersauTokens>;
    private listeners: Array<(state: UsersauState) => void> = [];

    constructor(config: UsersauConfig) {
        const host = new URL(config.host);
        if (host.pathname !== '/' || host.username || host.password || host.search || host.hash || !['https:', 'http:'].includes(host.protocol) || (host.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(host.hostname))) throw new Error('Invalid Users.au host.');
        this.config = {
            clientId: config.clientId,
            host: host.origin,
            redirectUri: config.redirectUri,
            afterLoginUrl: config.afterLoginUrl ?? '/',
            afterLogoutUrl: config.afterLogoutUrl ?? '/',
            afterRegisterUrl: config.afterRegisterUrl ?? '/',
            scopes: config.scopes ?? [...IDENTITY_SCOPES],
            storage: config.storage ?? 'localStorage',
        };

        this.storage = new TokenStorage(this.config.storage, `usersau:${encodeURIComponent(this.config.host)}:${encodeURIComponent(this.config.clientId)}`);

        // Rehydrate state from storage
        const tokens = this.storage.getTokens();
        const user = this.storage.getUser();

        this._state = {
            user,
            tokens,
            isAuthenticated: !!tokens && !!user,
            isLoading: false,
            error: null,
        };
    }

    // ── Public state ─────────────────────────────────────────────────────────────

    get state(): UsersauState {
        return this._state;
    }

    get user(): UsersauUser | null {
        return this._state.user;
    }

    get isAuthenticated(): boolean {
        return this._state.isAuthenticated;
    }

    get accessToken(): string | null {
        return this._state.tokens?.accessToken ?? null;
    }

    get preferences(): InterfacePreferences | null { return this.user?.[PREFERENCES_CLAIM] ?? null; }

    // ── State subscriptions ──────────────────────────────────────────────────────

    /** Subscribe to state changes. Returns an unsubscribe function. */
    subscribe(listener: (state: UsersauState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private setState(partial: Partial<UsersauState>): void {
        this._state = { ...this._state, ...partial };
        this.listeners.forEach((l) => l(this._state));
    }

    // ── Auth flows ───────────────────────────────────────────────────────────────

    /**
     * Initiates the OAuth login flow.
     * Mirrors PHP: AuthController::redirect()
     *
     * Generates PKCE verifier + challenge, stores state, then redirects the
     * browser to `{host}/oauth/authorize`.
     */
    async login(): Promise<void> {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const oauthState = generateState();

        this.storage.setPkceVerifier(verifier);
        this.storage.setOauthState(oauthState);
        this.storage.setFlow('login');

        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: this.config.scopes.join(' '),
            state: oauthState,
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });

        window.location.href = `${this.config.host}/oauth/authorize?${params}`;
    }

    /**
     * Initiates the OAuth registration flow.
     * Mirrors PHP: AuthController::register()
     */
    register(): void {
        this.storage.setFlow('register');

        const params = new URLSearchParams({
            redirect_uri: this.config.redirectUri,
        });

        window.location.href = `${this.config.host}/register?${params}`;
    }

    /**
     * Handles the OAuth callback (code exchange + user fetch).
     * Mirrors PHP: AuthController::callback()
     *
     * Call this method on the page that corresponds to your `redirectUri`.
     * Accepts query params from the current URL automatically, or pass them
     * explicitly (useful in Next.js where you have the search params).
     *
     * @returns The authenticated user
     */
    async handleCallback(params?: { code: string; state: string }): Promise<UsersauUser> {
        const run = ++this.generation;
        this.refreshing = undefined;
        this.setState({ isLoading: true, error: null });

        try {
            const searchParams = params
                ? new URLSearchParams(params as Record<string, string>)
                : new URLSearchParams(window.location.search);

            const code = searchParams.get('code');
            const returnedState = searchParams.get('state');
            const error = searchParams.get('error');

            if (error) {
                throw new Error(`OAuth error: ${error} — ${searchParams.get('error_description') ?? ''}`);
            }

            if (!code) {
                throw new Error('No authorization code found in callback URL.');
            }

            // Validate state to prevent CSRF
            const storedState = this.storage.getOauthState();
            if (!storedState || returnedState !== storedState) {
                throw new Error('OAuth state mismatch. Possible CSRF attack.');
            }

            const verifier = this.storage.getPkceVerifier();
            if (!verifier) {
                throw new Error('No PKCE verifier found. Did login() run in the same browser?');
            }

            this.storage.clearPkceVerifier();
            this.storage.clearOauthState();

            // Exchange code for tokens
            const tokens = await this.exchangeCodeForTokens(code, verifier);

            // Fetch user info
            const user = await this.fetchUserInfo(tokens.accessToken);

            if (run !== this.generation) throw new PreferencesError(401);

            // Persist
            this.storage.setTokens(tokens);
            this.storage.setUser(user);
            this.storage.clearPkceVerifier();
            this.storage.clearOauthState();

            const flow = this.storage.getFlow();
            this.storage.clearFlow();

            this.setState({ user, tokens, isAuthenticated: true, isLoading: false });

            // Redirect based on the flow — mirrors PHP callback()
            const redirectUrl =
                flow === 'register' ? this.config.afterRegisterUrl : this.config.afterLoginUrl;

            if (typeof window !== 'undefined' && !params) {
                // Only auto-redirect in browser context when not manually passing params
                window.location.href = redirectUrl;
            }

            return user;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            if (run === this.generation) this.setState({ isLoading: false, error });
            throw error;
        }
    }

    /**
     * Logs the user out locally and redirects to Users.au single sign-out.
     * Mirrors PHP: AuthController::logout()
     */
    logout(): void {
        this.generation++;
        this.refreshing = undefined;
        this.storage.clearAll();
        this.setState({ user: null, tokens: null, isAuthenticated: false, error: null });

        const params = new URLSearchParams({
            continue: this.resolveUrl(this.config.afterLogoutUrl),
        });

        window.location.href = `${this.config.host}/logout?${params}`;
    }

    /**
     * Redirects the authenticated user to their Users.au account management page.
     * Mirrors PHP: AuthController::account()
     */
    account(): void {
        if (!this._state.isAuthenticated) {
            this.login();
            return;
        }
        window.location.href = `${this.config.host}/account`;
    }

    /**
     * Refresh the access token using the stored refresh token.
     * Call this when you receive a 401 response from your API.
     */
    async refreshToken(): Promise<UsersauTokens> {
        if (this.refreshing) return this.refreshing;
        const pending = this.performRefresh();
        this.refreshing = pending;
        try { return await pending; }
        finally { if (this.refreshing === pending) this.refreshing = undefined; }
    }

    private async performRefresh(): Promise<UsersauTokens> {
        const run = this.generation;
        const currentTokens = this.storage.getTokens();
        if (!currentTokens?.refreshToken) {
            throw new Error('No refresh token available. User must log in again.');
        }

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.config.clientId,
            refresh_token: currentTokens.refreshToken,
        });

        const response = await fetch(`${this.config.host}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (run !== this.generation) throw new PreferencesError(401);
        if (!response.ok) {
            // Refresh token is invalid — clear session
            this.storage.clearAll();
            this.setState({ user: null, tokens: null, isAuthenticated: false });
            throw new Error(`Token refresh failed (${response.status}).`);
        }

        const data = await readIdentityJson(response) as TokenResponse;
        const tokens = this.parseTokenResponse(data);
        tokens.refreshToken ??= currentTokens.refreshToken;

        this.storage.setTokens(tokens);
        this.setState({ tokens });
        return tokens;
    }

    /**
     * Fetch the current user's info from Users.au.
     * Useful for refreshing profile data without re-authenticating.
     */
    async syncUser(): Promise<UsersauUser> {
        const run = this.generation;
        const subject = this.user?.sub;
        const token = this.accessToken;
        if (!token) throw new Error('Not authenticated.');

        const user = await this.fetchUserInfo(token);
        if (run !== this.generation || user.sub !== subject) throw new PreferencesError(502);
        this.storage.setUser(user);
        this.setState({ user });
        return user;
    }

    /** Fetch the current account's confirmed global preferences. */
    async getPreferences(): Promise<InterfacePreferences> {
        return this.preferenceRequest('GET');
    }

    /** Serialize writes and use the latest confirmed version unless explicitly supplied. */
    updatePreferences(changes: PreferenceChanges, expectedVersion?: number): Promise<InterfacePreferences> {
        const run = this.generation;
        const operation = this.preferenceWrites.then(async () => {
            if (run !== this.generation) throw new PreferencesError(401);
            const version = expectedVersion ?? (this.preferences ?? await this.getPreferences()).version;
            return this.preferenceRequest('PATCH', changes, version);
        });
        this.preferenceWrites = operation.catch(() => {});
        return operation;
    }

    private acceptPreferences(value: InterfacePreferences, run: number): InterfacePreferences {
        if (run !== this.generation || this.user?.sub !== value.sub) throw new PreferencesError(401);
        if (this.preferences && this.preferences.version > value.version) return this.preferences;
        const user = { ...this.user, [PREFERENCES_CLAIM]: value };
        if (value.locale) user.locale = value.locale;
        else delete user.locale;
        if (value.timezone) user.zoneinfo = value.timezone;
        else delete user.zoneinfo;
        this.storage.setUser(user);
        this.setState({ user });
        return value;
    }

    private async preferenceRequest(method: 'GET' | 'PATCH', changes?: PreferenceChanges, version?: number): Promise<InterfacePreferences> {
        const run = this.generation;
        const sub = this.user?.sub;
        if (!sub || !this.accessToken || this._state.isLoading) throw new PreferencesError(401);
        const fields = Object.fromEntries(Object.entries(changes ?? {}).filter(([key, value]) => ['locale', 'timezone', 'theme'].includes(key) && value !== undefined));
        for (let attempt = 0; attempt < 2; attempt++) {
            if (run !== this.generation) throw new PreferencesError(401);
            const response = await fetch(`${this.config.host}/api/interface-preferences`, {
                method, redirect: 'error', cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(5000),
                headers: { Accept: 'application/json', Authorization: `Bearer ${this.accessToken}`, ...(method === 'PATCH' ? { 'Content-Type': 'application/json' } : {}) },
                ...(method === 'PATCH' ? { body: JSON.stringify({ ...fields, expected_version: version }) } : {}),
            });
            if (run !== this.generation) throw new PreferencesError(401);
            if (response.status === 401 && attempt === 0 && this._state.tokens?.refreshToken) { await this.refreshToken(); continue; }
            if (response.status === 409) {
                const data = await readIdentityJson(response) as { preferences?: unknown };
                const latest = this.acceptPreferences(normalizePreferences(data.preferences, sub), run);
                throw new PreferencesError(409, latest);
            }
            if (!response.ok) throw new PreferencesError([401, 403, 422].includes(response.status) ? response.status : 503);
            return this.acceptPreferences(normalizePreferences(await readIdentityJson(response), sub), run);
        }
        throw new PreferencesError(401);
    }

    // ── Private helpers ──────────────────────────────────────────────────────────

    private async exchangeCodeForTokens(code: string, verifier: string): Promise<UsersauTokens> {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.config.clientId,
            code,
            redirect_uri: this.config.redirectUri,
            code_verifier: verifier,
        });

        const response = await fetch(`${this.config.host}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed (${response.status}).`);
        }

        const data = await readIdentityJson(response) as TokenResponse;
        return this.parseTokenResponse(data);
    }

    private async fetchUserInfo(accessToken: string): Promise<UsersauUser> {
        const response = await fetch(`${this.config.host}/api/user`, {
            headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user info (${response.status}).`);
        }

        return normalizeUserInfo(await readIdentityJson(response));
    }

    private parseTokenResponse(data: TokenResponse): UsersauTokens {
        if (typeof data.access_token !== 'string' || !data.access_token) throw new PreferencesError(502);
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
            tokenType: data.token_type,
            scope: data.scope,
        };
    }

    private resolveUrl(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url}`;
        }
        return url;
    }
}
