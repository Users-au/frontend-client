import { ref, readonly, type Ref, type DeepReadonly, inject, type App } from 'vue';
import { UsersauClient } from '../core/UsersauClient';
import type { UsersauConfig, UsersauUser, UsersauState } from '../core/types';

// ── Injection key ────────────────────────────────────────────────────────────

const USERSAU_KEY = Symbol('usersau');

// ── Plugin ───────────────────────────────────────────────────────────────────

export interface UsersauPluginOptions extends UsersauConfig { }

export const UsersauPlugin = {
    install(app: App, options: UsersauPluginOptions) {
        const client = new UsersauClient(options);
        app.provide(USERSAU_KEY, client);
    },
};

// ── Composable ───────────────────────────────────────────────────────────────

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
export function useUsersau(): UseUsersauReturn {
    const client = inject<UsersauClient>(USERSAU_KEY);
    if (!client) {
        throw new Error(
            '[useUsersau] No UsersauClient found. Did you install UsersauPlugin via app.use()?'
        );
    }

    const state = client.state;

    const user = ref<UsersauUser | null>(state.user);
    const isAuthenticated = ref<boolean>(state.isAuthenticated);
    const isLoading = ref<boolean>(state.isLoading);
    const error = ref<Error | null>(state.error);
    const accessToken = ref<string | null>(state.tokens?.accessToken ?? null);

    // Keep refs in sync with client state changes
    const unsubscribe = client.subscribe((newState: UsersauState) => {
        user.value = newState.user;
        isAuthenticated.value = newState.isAuthenticated;
        isLoading.value = newState.isLoading;
        error.value = newState.error;
        accessToken.value = newState.tokens?.accessToken ?? null;
    });

    // Clean up subscription when component unmounts
    // (getCurrentInstance check makes this safe if called outside setup)
    if (typeof window !== 'undefined') {
        // onUnmounted equivalent via Vue's lifecycle — import lazily to avoid
        // issues when used outside components
        import('vue').then(({ getCurrentInstance, onUnmounted }) => {
            if (getCurrentInstance()) {
                onUnmounted(unsubscribe);
            }
        });
    }

    return {
        user: readonly(user),
        isAuthenticated: readonly(isAuthenticated),
        isLoading: readonly(isLoading),
        error: readonly(error),
        accessToken: readonly(accessToken),
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
