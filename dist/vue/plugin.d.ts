import { type Ref, type DeepReadonly, type App } from 'vue';
import { UsersauClient } from '../core/UsersauClient';
import type { UsersauConfig, UsersauUser } from '../core/types';
export interface UsersauPluginOptions extends UsersauConfig {
}
export declare const UsersauPlugin: {
    install(app: App, options: UsersauPluginOptions): void;
};
export interface UseUsersauReturn {
    /** Currently authenticated user, or null */
    user: DeepReadonly<Ref<UsersauUser | null>>;
    /** Whether a user session is active */
    isAuthenticated: DeepReadonly<Ref<boolean>>;
    /** True while handleCallback() is exchanging tokens */
    isLoading: DeepReadonly<Ref<boolean>>;
    /** Last error from an auth operation */
    error: DeepReadonly<Ref<Error | null>>;
    /** Access token */
    accessToken: DeepReadonly<Ref<string | null>>;
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
 * Vue 3 composable for Users.au authentication.
 *
 * @example
 * ```ts
 * // main.ts
 * import { UsersauPlugin } from '@users-au/client/vue'
 * app.use(UsersauPlugin, { clientId: '...', host: '...', redirectUri: '...' })
 *
 * // MyComponent.vue
 * const { user, isAuthenticated, login, logout } = useUsersau()
 * ```
 */
export declare function useUsersau(): UseUsersauReturn;
