export interface UsersauConfig {
    /** Your Users.au OAuth client ID */
    clientId: string;
    /** Users.au host URL, e.g. https://auth.users.au */
    host: string;
    /** OAuth redirect URI registered with Users.au */
    redirectUri: string;
    /** URL to redirect to after successful login (default: '/') */
    afterLoginUrl?: string;
    /** URL to redirect to after logout (default: '/') */
    afterLogoutUrl?: string;
    /** URL to redirect to after registration (default: '/') */
    afterRegisterUrl?: string;
    /** OAuth scopes to request (default: ['openid', 'profile', 'email']) */
    scopes?: string[];
    /** Token storage strategy (default: 'localStorage') */
    storage?: 'localStorage' | 'sessionStorage' | 'memory';
}
export interface UsersauUser {
    id: string;
    nickname?: string;
    name: string;
    email: string;
    avatar?: string;
}
export interface UsersauTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
}
export interface UsersauState {
    user: UsersauUser | null;
    tokens: UsersauTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
}
export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
}
export interface UserInfoResponse {
    id: string;
    nickname?: string;
    name: string;
    email: string;
    avatar?: string;
}
