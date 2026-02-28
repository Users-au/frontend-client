import type { UsersauTokens, UsersauUser } from './types';

const KEYS = {
    tokens: 'usersau_tokens',
    user: 'usersau_user',
    pkceVerifier: 'usersau_pkce_verifier',
    oauthState: 'usersau_oauth_state',
    flow: 'usersau_flow',
} as const;

type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

// In-memory fallback for SSR environments (no window).
// Each TokenStorage instance that uses 'memory' gets its OWN isolated map
// so that multiple instances never share state.

export class TokenStorage {
    private store: Storage | Record<string, string>;

    constructor(type: StorageType = 'localStorage') {
        if (type === 'memory') {
            this.store = {};
        } else {
            try {
                // Guard for SSR / environments without window
                if (typeof window === 'undefined') {
                    this.store = {};
                } else {
                    this.store = type === 'sessionStorage' ? window.sessionStorage : window.localStorage;
                }
            } catch {
                this.store = {};
            }
        }
    }

    // ── Tokens ──────────────────────────────────────────────────────────────────

    setTokens(tokens: UsersauTokens): void {
        this.store[KEYS.tokens] = JSON.stringify(tokens);
    }

    getTokens(): UsersauTokens | null {
        const raw = this.store[KEYS.tokens];
        if (!raw) return null;
        try {
            return JSON.parse(raw) as UsersauTokens;
        } catch {
            return null;
        }
    }

    clearTokens(): void {
        delete this.store[KEYS.tokens];
    }

    // ── User ────────────────────────────────────────────────────────────────────

    setUser(user: UsersauUser): void {
        this.store[KEYS.user] = JSON.stringify(user);
    }

    getUser(): UsersauUser | null {
        const raw = this.store[KEYS.user];
        if (!raw) return null;
        try {
            return JSON.parse(raw) as UsersauUser;
        } catch {
            return null;
        }
    }

    clearUser(): void {
        delete this.store[KEYS.user];
    }

    // ── PKCE / OAuth helpers ─────────────────────────────────────────────────────

    setPkceVerifier(verifier: string): void {
        this.store[KEYS.pkceVerifier] = verifier;
    }

    getPkceVerifier(): string | null {
        return this.store[KEYS.pkceVerifier] ?? null;
    }

    clearPkceVerifier(): void {
        delete this.store[KEYS.pkceVerifier];
    }

    setOauthState(state: string): void {
        this.store[KEYS.oauthState] = state;
    }

    getOauthState(): string | null {
        return this.store[KEYS.oauthState] ?? null;
    }

    clearOauthState(): void {
        delete this.store[KEYS.oauthState];
    }

    setFlow(flow: 'login' | 'register'): void {
        this.store[KEYS.flow] = flow;
    }

    getFlow(): 'login' | 'register' {
        return (this.store[KEYS.flow] as 'login' | 'register') ?? 'login';
    }

    clearFlow(): void {
        delete this.store[KEYS.flow];
    }

    // ── Clear all ────────────────────────────────────────────────────────────────

    clearAll(): void {
        this.clearTokens();
        this.clearUser();
        this.clearPkceVerifier();
        this.clearOauthState();
        this.clearFlow();
    }
}
