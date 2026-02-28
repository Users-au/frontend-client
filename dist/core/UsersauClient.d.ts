import type { UsersauConfig, UsersauUser, UsersauTokens, UsersauState } from './types';
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
export declare class UsersauClient {
    private config;
    private storage;
    private _state;
    private listeners;
    constructor(config: UsersauConfig);
    get state(): UsersauState;
    get user(): UsersauUser | null;
    get isAuthenticated(): boolean;
    get accessToken(): string | null;
    /** Subscribe to state changes. Returns an unsubscribe function. */
    subscribe(listener: (state: UsersauState) => void): () => void;
    private setState;
    /**
     * Initiates the OAuth login flow.
     * Mirrors PHP: AuthController::redirect()
     *
     * Generates PKCE verifier + challenge, stores state, then redirects the
     * browser to `{host}/oauth/authorize`.
     */
    login(): Promise<void>;
    /**
     * Initiates the OAuth registration flow.
     * Mirrors PHP: AuthController::register()
     */
    register(): void;
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
    handleCallback(params?: {
        code: string;
        state: string;
    }): Promise<UsersauUser>;
    /**
     * Logs the user out locally and redirects to Users.au single sign-out.
     * Mirrors PHP: AuthController::logout()
     */
    logout(): void;
    /**
     * Redirects the authenticated user to their Users.au account management page.
     * Mirrors PHP: AuthController::account()
     */
    account(): void;
    /**
     * Refresh the access token using the stored refresh token.
     * Call this when you receive a 401 response from your API.
     */
    refreshToken(): Promise<UsersauTokens>;
    /**
     * Fetch the current user's info from Users.au.
     * Useful for refreshing profile data without re-authenticating.
     */
    syncUser(): Promise<UsersauUser>;
    private exchangeCodeForTokens;
    private fetchUserInfo;
    private parseTokenResponse;
    private resolveUrl;
}
