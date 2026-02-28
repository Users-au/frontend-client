import { describe, it, expect, beforeEach } from 'vitest';
import { TokenStorage } from '../../src/core/storage';
import type { UsersauTokens, UsersauUser } from '../../src/core/types';

const mockTokens: UsersauTokens = {
    accessToken: 'test_access_token',
    refreshToken: 'test_refresh_token',
    expiresAt: Date.now() + 3600 * 1000,
    tokenType: 'Bearer',
    scope: 'openid profile email',
};

const mockUser: UsersauUser = {
    id: 'user_123',
    nickname: 'johnd',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
};

describe('TokenStorage', () => {
    describe('memory storage', () => {
        let storage: TokenStorage;

        beforeEach(() => {
            storage = new TokenStorage('memory');
            storage.clearAll();
        });

        it('stores and retrieves tokens', () => {
            storage.setTokens(mockTokens);
            expect(storage.getTokens()).toEqual(mockTokens);
        });

        it('returns null when no tokens stored', () => {
            expect(storage.getTokens()).toBeNull();
        });

        it('clears tokens', () => {
            storage.setTokens(mockTokens);
            storage.clearTokens();
            expect(storage.getTokens()).toBeNull();
        });

        it('stores and retrieves user', () => {
            storage.setUser(mockUser);
            expect(storage.getUser()).toEqual(mockUser);
        });

        it('returns null when no user stored', () => {
            expect(storage.getUser()).toBeNull();
        });

        it('clears user', () => {
            storage.setUser(mockUser);
            storage.clearUser();
            expect(storage.getUser()).toBeNull();
        });

        it('stores and retrieves PKCE verifier', () => {
            storage.setPkceVerifier('my_verifier');
            expect(storage.getPkceVerifier()).toBe('my_verifier');
        });

        it('clears PKCE verifier', () => {
            storage.setPkceVerifier('my_verifier');
            storage.clearPkceVerifier();
            expect(storage.getPkceVerifier()).toBeNull();
        });

        it('stores and retrieves OAuth state', () => {
            storage.setOauthState('my_state');
            expect(storage.getOauthState()).toBe('my_state');
        });

        it('clears OAuth state', () => {
            storage.setOauthState('my_state');
            storage.clearOauthState();
            expect(storage.getOauthState()).toBeNull();
        });

        it('stores and retrieves flow', () => {
            storage.setFlow('register');
            expect(storage.getFlow()).toBe('register');
        });

        it('defaults flow to login when not set', () => {
            expect(storage.getFlow()).toBe('login');
        });

        it('clearAll removes everything', () => {
            storage.setTokens(mockTokens);
            storage.setUser(mockUser);
            storage.setPkceVerifier('v');
            storage.setOauthState('s');
            storage.setFlow('register');

            storage.clearAll();

            expect(storage.getTokens()).toBeNull();
            expect(storage.getUser()).toBeNull();
            expect(storage.getPkceVerifier()).toBeNull();
            expect(storage.getOauthState()).toBeNull();
            expect(storage.getFlow()).toBe('login');
        });
    });

    describe('localStorage storage', () => {
        let storage: TokenStorage;

        beforeEach(() => {
            localStorage.clear();
            storage = new TokenStorage('localStorage');
        });

        it('stores and retrieves tokens from localStorage', () => {
            storage.setTokens(mockTokens);
            expect(storage.getTokens()).toEqual(mockTokens);
        });

        it('persists across storage instances', () => {
            storage.setTokens(mockTokens);
            const storage2 = new TokenStorage('localStorage');
            expect(storage2.getTokens()).toEqual(mockTokens);
        });

        it('returns null for corrupted JSON', () => {
            localStorage.setItem('usersau_tokens', 'not-json');
            expect(storage.getTokens()).toBeNull();
        });
    });
});
