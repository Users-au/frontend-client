import type { InterfacePreferences, UsersauUser } from './types';
export declare const PREFERENCES_CLAIM: "urn:usersau:preferences";
export declare const IDENTITY_SCOPES: readonly ["openid", "profile", "email", "preferences:read", "preferences:write"];
export declare class PreferencesError extends Error {
    readonly status: number;
    readonly preferences?: InterfacePreferences | undefined;
    constructor(status: number, preferences?: InterfacePreferences | undefined);
}
export declare function normalizePreferences(value: unknown, subject: string): InterfacePreferences;
/** Whitelist scoped claims; never copy arbitrary token/server fields into user state. */
export declare function normalizeUserInfo(value: unknown): UsersauUser;
export declare function readIdentityJson(response: Pick<Response, 'json'>): Promise<unknown>;
