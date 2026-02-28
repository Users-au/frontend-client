import type { UsersauTokens, UsersauUser } from './types';
type StorageType = 'localStorage' | 'sessionStorage' | 'memory';
export declare class TokenStorage {
    private store;
    constructor(type?: StorageType);
    setTokens(tokens: UsersauTokens): void;
    getTokens(): UsersauTokens | null;
    clearTokens(): void;
    setUser(user: UsersauUser): void;
    getUser(): UsersauUser | null;
    clearUser(): void;
    setPkceVerifier(verifier: string): void;
    getPkceVerifier(): string | null;
    clearPkceVerifier(): void;
    setOauthState(state: string): void;
    getOauthState(): string | null;
    clearOauthState(): void;
    setFlow(flow: 'login' | 'register'): void;
    getFlow(): 'login' | 'register';
    clearFlow(): void;
    clearAll(): void;
}
export {};
