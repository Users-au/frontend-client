import { type ReactNode } from 'react';
import { UsersauClient } from '../core/UsersauClient';
import type { UsersauConfig, UsersauUser, UsersauTokens } from '../core/types';
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
export declare function UsersauProvider({ config, children }: UsersauProviderProps): import("react/jsx-runtime").JSX.Element;
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
    handleCallback: (params?: {
        code: string;
        state: string;
    }) => Promise<UsersauUser>;
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
export declare function useUsersau(): UseUsersauReturn;
