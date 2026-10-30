/**
 * @users-au/client — Next.js browser integration.
 *
 * Re-exports the React adapter. Mount UsersauProvider in a client component and
 * handle the callback in the browser. Core storage uses an isolated in-memory
 * fallback during server-side construction; this does not create a server
 * session or authorize server-side data access.
 *
 * Use sessionStorage or localStorage for a browser redirect flow so the PKCE
 * verifier and OAuth state survive navigation. Register a public OAuth client
 * with PKCE and the required CORS configuration. Never put a client secret in
 * NEXT_PUBLIC_* variables or browser code.
 *
 * For confidential clients and server-managed sessions, use a server auth
 * implementation that validates OAuth state/CSRF, exchanges the code privately,
 * sets secure session cookies and enforces authorization on every protected
 * server entry point. See https://github.com/Users-au/nextjs-starter-kit.
 */

export { UsersauClient } from '../core/UsersauClient';
export { UsersauProvider, useUsersau } from '../react/index';
export type { UsersauProviderProps, UseUsersauReturn } from '../react/index';
export type {
    InterfacePreferences,
    PreferenceChanges,
    UsersauConfig,
    UsersauUser,
    UsersauTokens,
    UsersauState,
} from '../core/types';

export { normalizeUserInfo, normalizePreferences, readIdentityJson, PreferencesError, PREFERENCES_CLAIM, IDENTITY_SCOPES } from '../core/identity';
