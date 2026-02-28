import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { UsersauClient } from '../core/UsersauClient';
import type { UsersauConfig, UsersauUser, UsersauState, UsersauTokens } from '../core/types';

// ── Context ──────────────────────────────────────────────────────────────────

interface UsersauContextValue {
    client: UsersauClient;
    state: UsersauState;
}

const UsersauContext = createContext<UsersauContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export interface UsersauProviderProps {
    config: UsersauConfig;
    children: ReactNode;
}

/**
 * Wrap your application with this provider.
 *
 * @example
 * ```tsx
 * // app.tsx
 * import { UsersauProvider } from '@users-au/client/react'
 *
 * export default function App() {
 *   return (
 *     <UsersauProvider config={{ clientId: '...', host: '...', redirectUri: '...' }}>
 *       <MyApp />
 *     </UsersauProvider>
 *   )
 * }
 * ```
 */
export function UsersauProvider({ config, children }: UsersauProviderProps) {
    // Use a ref so the client isn't recreated on each render
    const clientRef = useRef<UsersauClient | null>(null);
    if (!clientRef.current) {
        clientRef.current = new UsersauClient(config);
    }
    const client = clientRef.current;

    const [state, setState] = useState<UsersauState>(client.state);

    useEffect(() => {
        const unsubscribe = client.subscribe((newState) => {
            setState(newState);
        });
        return unsubscribe;
    }, [client]);

    return (
        <UsersauContext.Provider value={{ client, state }}>
            {children}
        </UsersauContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseUsersauReturn {
    /** Currently authenticated user, or null */
    user: UsersauUser | null;
    /** Whether a user session is active */
    isAuthenticated: boolean;
    /** True while handleCallback() is exchanging tokens */
    isLoading: boolean;
    /** Last error from an auth operation */
    error: Error | null;
    /** Current token set */
    tokens: UsersauTokens | null;
    /** Start the login OAuth flow */
    login: () => Promise<void>;
    /** Start the registration OAuth flow */
    register: () => void;
    /** Handle the OAuth callback page */
    handleCallback: (params?: { code: string; state: string }) => Promise<UsersauUser>;
    /** Log out and redirect to Users.au logout */
    logout: () => void;
    /** Redirect to Users.au account management */
    account: () => void;
    /** Refresh the access token */
    refreshToken: () => Promise<void>;
    /** Sync user info from Users.au */
    syncUser: () => Promise<UsersauUser>;
    /** Raw client instance */
    client: UsersauClient;
}

/**
 * React hook for Users.au authentication.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useUsersau()
 * ```
 */
export function useUsersau(): UseUsersauReturn {
    const ctx = useContext(UsersauContext);
    if (!ctx) {
        throw new Error(
            '[useUsersau] No UsersauContext found. Wrap your app with <UsersauProvider>.'
        );
    }

    const { client, state } = ctx;

    return {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        tokens: state.tokens,
        login: () => client.login(),
        register: () => client.register(),
        handleCallback: (params) => client.handleCallback(params),
        logout: () => client.logout(),
        account: () => client.account(),
        refreshToken: async () => { await client.refreshToken(); },
        syncUser: () => client.syncUser(),
        client,
    };
}
