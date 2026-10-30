// Core types for the Users.au client library

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
    /** OAuth scopes to request (default: identity plus preference read/write) */
    scopes?: string[];
    /** Token storage strategy (default: 'localStorage') */
    storage?: 'localStorage' | 'sessionStorage' | 'memory';
}

export interface InterfacePreferences {
    sub: string;
    locale?: string | null;
    timezone?: string | null;
    theme: 'system' | 'light' | 'dark';
    version: number;
}

export type PreferenceChanges = { locale?: string; timezone?: string; theme?: InterfacePreferences['theme'] };

export interface UsersauUser {
    /** Alias for sub for application display/routing. Identity is issuer + sub. */
    id: string;
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    middle_name?: string;
    nickname?: string;
    preferred_username?: string;
    profile?: string;
    picture?: string;
    avatar?: string;
    website?: string;
    gender?: string;
    birthdate?: string;
    zoneinfo?: string;
    locale?: string;
    updated_at?: number;
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_number_verified?: boolean;
    address?: Partial<Record<'formatted' | 'street_address' | 'locality' | 'region' | 'postal_code' | 'country', string>>;
    'urn:usersau:preferences'?: InterfacePreferences;
}

export interface UsersauTokens {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number; // Unix timestamp in ms
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

export type UserInfoResponse = Partial<UsersauUser>;
