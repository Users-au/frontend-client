import type {
    UsersauConfig,
    UsersauUser,
    UsersauTokens,
    UsersauState,
    TokenResponse,
    UserInfoResponse,
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
    private listeners: Array<(state: UsersauState) => void> = [];

    constructor(config: UsersauConfig) {
        this.config = {
            clientId: config.clientId,
            host: config.host.replace(/\/$/, ''), // strip trailing slash
            redirectUri: config.redirectUri,
            afterLoginUrl: config.afterLoginUrl ?? '/',
            afterLogoutUrl: config.afterLogoutUrl ?? '/',
            afterRegisterUrl: config.afterRegisterUrl ?? '/',
            scopes: config.scopes ?? ['openid', 'profile', 'email'],
            storage: config.storage ?? 'localStorage',
        };

        this.storage = new TokenStorage(this.config.storage);

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
            if (storedState && returnedState !== storedState) {
                throw new Error('OAuth state mismatch. Possible CSRF attack.');
            }

            const verifier = this.storage.getPkceVerifier();
            if (!verifier) {
                throw new Error('No PKCE verifier found. Did login() run in the same browser?');
            }

            // Exchange code for tokens
            const tokens = await this.exchangeCodeForTokens(code, verifier);

            // Fetch user info
            const user = await this.fetchUserInfo(tokens.accessToken);

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
            this.setState({ isLoading: false, error });
            throw error;
        }
    }

    /**
     * Logs the user out locally and redirects to Users.au single sign-out.
     * Mirrors PHP: AuthController::logout()
     */
    logout(): void {
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

        if (!response.ok) {
            // Refresh token is invalid — clear session
            this.storage.clearAll();
            this.setState({ user: null, tokens: null, isAuthenticated: false });
            throw new Error(`Token refresh failed (${response.status}).`);
        }

        const data: TokenResponse = await response.json();
        const tokens = this.parseTokenResponse(data);

        this.storage.setTokens(tokens);
        this.setState({ tokens });
        return tokens;
    }

    /**
     * Fetch the current user's info from Users.au.
     * Useful for refreshing profile data without re-authenticating.
     */
    async syncUser(): Promise<UsersauUser> {
        const token = this.accessToken;
        if (!token) throw new Error('Not authenticated.');

        const user = await this.fetchUserInfo(token);
        this.storage.setUser(user);
        this.setState({ user });
        return user;
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
            const text = await response.text().catch(() => '');
            throw new Error(`Token exchange failed (${response.status}): ${text}`);
        }

        const data: TokenResponse = await response.json();
        return this.parseTokenResponse(data);
    }

    private async fetchUserInfo(accessToken: string): Promise<UsersauUser> {
        const response = await fetch(`${this.config.host}/api/user`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user info (${response.status}).`);
        }

        const data: UserInfoResponse = await response.json();

        return {
            id: data.id,
            nickname: data.nickname,
            name: data.name,
            email: data.email,
            avatar: data.avatar,
        };
    }

    private parseTokenResponse(data: TokenResponse): UsersauTokens {
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
