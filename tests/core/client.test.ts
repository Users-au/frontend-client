/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UsersauClient } from '../../src/core/UsersauClient';
import type { UsersauConfig } from '../../src/core/types';

const baseConfig: UsersauConfig = {
    clientId: 'test_client_id',
    host: 'https://auth.example.com',
    redirectUri: 'http://localhost/auth/callback',
    afterLoginUrl: '/dashboard',
    afterLogoutUrl: '/',
    afterRegisterUrl: '/welcome',
    storage: 'memory',
};

// Helper to build a mock fetch response
function mockFetchResponse(data: object, status = 200) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
    } as Response);
}

const mockTokenResponse = {
    access_token: 'acc_token_abc',
    refresh_token: 'ref_token_xyz',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'openid profile email',
};

const mockUserInfoResponse = {
    id: 'user_42',
    nickname: 'janed',
    name: 'Jane Doe',
    email: 'jane@example.com',
    avatar: 'https://example.com/avatar.jpg',
};

// Stub fetch via vi.stubGlobal so tests don't need to manage global type
function stubFetch(...responses: ReturnType<typeof mockFetchResponse>[]) {
    const fetchSpy = vi.fn();
    responses.forEach((r) => fetchSpy.mockResolvedValueOnce(r));
    vi.stubGlobal('fetch', fetchSpy);
    return fetchSpy;
}

describe('UsersauClient', () => {
    let client: UsersauClient;

    beforeEach(() => {
        client = new UsersauClient(baseConfig);
        window.location.href = 'http://localhost/';
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    // ── Initialisation ──────────────────────────────────────────────────────────

    describe('initialisation', () => {
        it('starts unauthenticated', () => {
            expect(client.isAuthenticated).toBe(false);
            expect(client.user).toBeNull();
            expect(client.accessToken).toBeNull();
        });

        it('strips trailing slash from host', () => {
            const c = new UsersauClient({ ...baseConfig, host: 'https://auth.example.com/' });
            expect(() => c.login()).not.toThrow();
        });

        it('rehydrates from storage when tokens exist', () => {
            localStorage.setItem(
                'usersau:https%3A%2F%2Fauth.example.com:test_client_id:usersau_tokens',
                JSON.stringify({ accessToken: 'stored_token', refreshToken: 'stored_refresh' })
            );
            localStorage.setItem(
                'usersau:https%3A%2F%2Fauth.example.com:test_client_id:usersau_user',
                JSON.stringify({ id: '1', name: 'Test', email: 'test@example.com' })
            );

            const secondClient = new UsersauClient({ ...baseConfig, storage: 'localStorage' });
            expect(secondClient.isAuthenticated).toBe(true);
            expect(secondClient.user?.name).toBe('Test');
            localStorage.clear();
        });
    });

    // ── login() ─────────────────────────────────────────────────────────────────

    describe('login()', () => {
        it('redirects to the Users.au authorization endpoint', async () => {
            await client.login();
            expect(window.location.href).toContain('https://auth.example.com/oauth/authorize');
        });

        it('includes required OAuth parameters', async () => {
            await client.login();
            const url = new URL(window.location.href);
            expect(url.searchParams.get('client_id')).toBe('test_client_id');
            expect(url.searchParams.get('redirect_uri')).toBe('http://localhost/auth/callback');
            expect(url.searchParams.get('response_type')).toBe('code');
            expect(url.searchParams.get('state')).toBeTruthy();
        });

        it('includes PKCE code_challenge parameters', async () => {
            await client.login();
            const url = new URL(window.location.href);
            expect(url.searchParams.get('code_challenge')).toBeTruthy();
            expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        });

        it('includes requested scopes', async () => {
            const c = new UsersauClient({ ...baseConfig, scopes: ['openid', 'profile'] });
            await c.login();
            const url = new URL(window.location.href);
            expect(url.searchParams.get('scope')).toBe('openid profile');
        });
    });

    // ── register() ──────────────────────────────────────────────────────────────

    describe('register()', () => {
        it('redirects to the Users.au registration page', () => {
            client.register();
            expect(window.location.href).toContain('https://auth.example.com/register');
        });

        it('includes the redirect_uri parameter', () => {
            client.register();
            const url = new URL(window.location.href);
            expect(url.searchParams.get('redirect_uri')).toBe('http://localhost/auth/callback');
        });
    });

    // ── logout() ────────────────────────────────────────────────────────────────

    describe('logout()', () => {
        it('redirects to Users.au logout endpoint', () => {
            client.logout();
            expect(window.location.href).toContain('https://auth.example.com/logout');
        });

        it('includes a continue parameter pointing to afterLogoutUrl', () => {
            const c = new UsersauClient({ ...baseConfig, afterLogoutUrl: '/bye' });
            c.logout();
            const url = new URL(window.location.href);
            expect(url.searchParams.get('continue')).toContain('/bye');
        });

        it('clears authentication state', () => {
            client.logout();
            expect(client.isAuthenticated).toBe(false);
            expect(client.user).toBeNull();
            expect(client.accessToken).toBeNull();
        });
    });

    // ── account() ───────────────────────────────────────────────────────────────

    describe('account()', () => {
        it('calls login() when not authenticated', async () => {
            client.account();
            // login() is async; wait for PKCE generation + location assignment
            await new Promise((r) => setTimeout(r, 50));
            expect(window.location.href).toContain('/oauth/authorize');
        });

        it('redirects to Users.au account page when authenticated', async () => {
            await client.login();
            stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse)
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await client.handleCallback({ code: 'test_code', state: callbackState });

            window.location.href = 'http://localhost/';
            client.account();
            expect(window.location.href).toBe('https://auth.example.com/account');
        });
    });

    // ── handleCallback() ────────────────────────────────────────────────────────

    describe('handleCallback()', () => {
        beforeEach(async () => {
            await client.login();
        });

        it('exchanges code for tokens and fetches user info', async () => {
            stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse)
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            const user = await client.handleCallback({ code: 'auth_code_123', state: callbackState });

            expect(user.id).toBe('user_42');
            expect(user.name).toBe('Jane Doe');
            expect(user.email).toBe('jane@example.com');
        });

        it('sets isAuthenticated to true after successful callback', async () => {
            stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse)
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await client.handleCallback({ code: 'code', state: callbackState });
            expect(client.isAuthenticated).toBe(true);
        });

        it('stores the access token', async () => {
            stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse)
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await client.handleCallback({ code: 'code', state: callbackState });
            expect(client.accessToken).toBe('acc_token_abc');
        });

        it('throws when no authorization code is present', async () => {
            const freshClient = new UsersauClient(baseConfig);
            await expect(
                freshClient.handleCallback({ code: '', state: '' })
            ).rejects.toThrow('No authorization code');
        });

        it('throws and sets error state on failed token exchange', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: () => Promise.resolve('invalid_grant'),
            } as Response));

            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await expect(
                client.handleCallback({ code: 'bad_code', state: callbackState })
            ).rejects.toThrow('Token exchange failed');

            expect(client.state.error).toBeInstanceOf(Error);
        });

        it('calls token endpoint with correct parameters', async () => {
            const fetchSpy = stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse)
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await client.handleCallback({ code: 'my_code', state: callbackState });

            const [tokenUrl, tokenOptions] = fetchSpy.mock.calls[0];
            expect(tokenUrl).toBe('https://auth.example.com/oauth/token');
            expect(tokenOptions.method).toBe('POST');

            const body = new URLSearchParams(tokenOptions.body as string);
            expect(body.get('grant_type')).toBe('authorization_code');
            expect(body.get('client_id')).toBe('test_client_id');
            expect(body.get('code')).toBe('my_code');
            expect(body.get('redirect_uri')).toBe('http://localhost/auth/callback');
            expect(body.get('code_verifier')).toBeTruthy();
        });

        it('calls user info endpoint with Bearer token', async () => {
            const fetchSpy = stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse)
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await client.handleCallback({ code: 'my_code', state: callbackState });

            const [userUrl, userOptions] = fetchSpy.mock.calls[1];
            expect(userUrl).toBe('https://auth.example.com/api/user');
            expect(userOptions.headers.Authorization).toBe('Bearer acc_token_abc');
        });
    });

    // ── refreshToken() ──────────────────────────────────────────────────────────

    describe('refreshToken()', () => {
        it('throws when no refresh token is available', async () => {
            const freshClient = new UsersauClient({ ...baseConfig, storage: 'memory' });
            await expect(freshClient.refreshToken()).rejects.toThrow('No refresh token available');
        });

        it('calls token endpoint with refresh_token grant', async () => {
            // Authenticate first
            await client.login();
            const fetchSpy = stubFetch(
                mockFetchResponse(mockTokenResponse),
                mockFetchResponse(mockUserInfoResponse),
                mockFetchResponse({ ...mockTokenResponse, access_token: 'new_token' })
            );
            const callbackState = new URL(window.location.href).searchParams.get('state')!;
            await client.handleCallback({ code: 'code', state: callbackState });
            await client.refreshToken();

            const refreshCall = fetchSpy.mock.calls[2];
            expect(refreshCall[0]).toBe('https://auth.example.com/oauth/token');
            const body = new URLSearchParams(refreshCall[1].body as string);
            expect(body.get('grant_type')).toBe('refresh_token');
        });
    });

    // ── subscribe() ─────────────────────────────────────────────────────────────

    describe('subscribe()', () => {
        it('calls listener when state changes', () => {
            const listener = vi.fn();
            const unsubscribe = client.subscribe(listener);
            client.logout();
            expect(listener).toHaveBeenCalledTimes(1);
            unsubscribe();
        });

        it('stops calling listener after unsubscribe', () => {
            const listener = vi.fn();
            const unsubscribe = client.subscribe(listener);
            unsubscribe();
            client.logout();
            expect(listener).not.toHaveBeenCalled();
        });

        it('passes updated state to listener', () => {
            const states: boolean[] = [];
            client.subscribe((s) => states.push(s.isAuthenticated));
            client.logout();
            expect(states[states.length - 1]).toBe(false);
        });
    });
});
