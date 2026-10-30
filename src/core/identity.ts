import type { InterfacePreferences, UsersauUser } from './types';

export const PREFERENCES_CLAIM = 'urn:usersau:preferences' as const;
export const IDENTITY_SCOPES = ['openid', 'profile', 'email', 'preferences:read', 'preferences:write'] as const;

export class PreferencesError extends Error {
    constructor(public readonly status: number, public readonly preferences?: InterfacePreferences) {
        super(status === 409 ? 'preferences_conflict' : [401, 403].includes(status) ? 'preferences_reauthorization_required' : 'preferences_unavailable');
        this.name = 'PreferencesError';
    }
}

export function normalizePreferences(value: unknown, subject: string): InterfacePreferences {
    if (!value || typeof value !== 'object') throw new PreferencesError(502);
    const data = value as Record<string, unknown>;
    if (data.sub !== subject || !Number.isSafeInteger(data.version) || (data.version as number) < 0
        || !['system', 'light', 'dark'].includes(data.theme as string)) throw new PreferencesError(502);
    if (data.locale != null && (typeof data.locale !== 'string' || data.locale.length > 35 || !/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(data.locale))) throw new PreferencesError(502);
    if (data.timezone != null) {
        if (typeof data.timezone !== 'string') throw new PreferencesError(502);
        try { new Intl.DateTimeFormat('en', { timeZone: data.timezone }); } catch { throw new PreferencesError(502); }
    }
    return { sub: subject, locale: data.locale as string | null | undefined, timezone: data.timezone as string | null | undefined,
        theme: data.theme as InterfacePreferences['theme'], version: data.version as number };
}

/** Whitelist scoped claims; never copy arbitrary token/server fields into user state. */
export function normalizeUserInfo(value: unknown): UsersauUser {
    if (!value || typeof value !== 'object') throw new PreferencesError(502);
    const data = value as Record<string, unknown>;
    const sub = data.sub ?? (typeof data.id === 'number' ? String(data.id) : data.id);
    if (typeof sub !== 'string' || sub.length > 255 || !sub || sub.trim() !== sub || /[\s\x00-\x1f\x7f]/.test(sub)
        || (data.sub != null && data.id != null && String(data.id) !== sub)) throw new PreferencesError(502);
    const user: UsersauUser = { id: sub, sub };
    const output = user as unknown as Record<string, unknown>;
    for (const key of ['name', 'given_name', 'family_name', 'middle_name', 'nickname', 'preferred_username', 'gender', 'birthdate', 'zoneinfo', 'locale', 'email', 'phone_number']) {
        if (typeof data[key] === 'string' && data[key] !== '') output[key] = data[key];
    }
    for (const key of ['profile', 'picture', 'website']) {
        const input = key === 'picture' ? (data.picture ?? data.avatar ?? data.image) : data[key];
        if (typeof input !== 'string') continue;
        try { if (['http:', 'https:'].includes(new URL(input).protocol)) output[key] = input; } catch { /* Omit invalid optional URLs. */ }
    }
    if (user.picture) user.avatar = user.picture;
    for (const key of ['email_verified', 'phone_number_verified']) if (typeof data[key] === 'boolean') output[key] = data[key];
    if (Number.isSafeInteger(data.updated_at)) user.updated_at = data.updated_at as number;
    if (data.address && typeof data.address === 'object') {
        const address = data.address as Record<string, unknown>;
        user.address = Object.fromEntries(['formatted', 'street_address', 'locality', 'region', 'postal_code', 'country']
            .filter(key => typeof address[key] === 'string').map(key => [key, address[key] as string]));
    }
    if (data[PREFERENCES_CLAIM] != null) user[PREFERENCES_CLAIM] = normalizePreferences(data[PREFERENCES_CLAIM], sub);
    return user;
}

export async function readIdentityJson(response: Pick<Response, 'json'>): Promise<unknown> {
    try { return await response.json(); } catch { throw new PreferencesError(502); }
}
