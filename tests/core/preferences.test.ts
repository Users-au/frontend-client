import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { UsersauClient } from '../../src/core/UsersauClient';
import { normalizeUserInfo, normalizePreferences, PREFERENCES_CLAIM } from '../../src/core/identity';
import type { InterfacePreferences } from '../../src/core/types';

const config = { clientId: 'public', host: 'https://identity.test', redirectUri: 'http://localhost/callback', storage: 'memory' as const };
const state = (version = 1): InterfacePreferences => ({ sub: 'one', locale: 'en-AU', timezone: 'Australia/Sydney', theme: 'dark', version });
const response = (data: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data }) as Response;
async function authenticated() {
    const client = new UsersauClient(config);
    await client.login();
    const codeState = new URL(window.location.href).searchParams.get('state')!;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ access_token: 'private', refresh_token: 'refresh' }))
        .mockResolvedValueOnce(response({ sub: 'one', given_name: 'Jane', [PREFERENCES_CLAIM]: state() })));
    await client.handleCallback({ code: 'code', state: codeState });
    return client;
}
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('identity preference contract', () => {
    it('keeps scoped standard claims, filters secrets/unsafe URLs, and rejects inconsistent subjects', () => {
        const user = normalizeUserInfo({ sub: 'one', given_name: 'Jane', picture: 'javascript:alert(1)', email_verified: false,
            updated_at: 123, phone_number: '+61400000000', address: { country: 'AU', password: 'hidden' }, password: 'secret', [PREFERENCES_CLAIM]: state() });
        expect(user.given_name).toBe('Jane');
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('picture');
        expect(user.address).toEqual({ country: 'AU' });
        expect(user.email_verified).toBe(false);
        expect(() => normalizeUserInfo({ sub: 'one', id: 'other' })).toThrow();
        expect(() => normalizePreferences({ ...state(), timezone: 'Mars/Base' }, 'one')).toThrow();
    });
    it('requests the shared scopes and serializes field-level writes against confirmed versions', async () => {
        const client = await authenticated();
        const inputs: Record<string, unknown>[] = [];
        let current = state();
        vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
            const input = JSON.parse(options.body); inputs.push(input);
            expect(input.expected_version).toBe(current.version);
            current = { ...current, theme: input.theme, version: current.version + 1 };
            return response(current);
        }));
        await Promise.all([client.updatePreferences({ theme: 'light', user_id: 2 } as never), client.updatePreferences({ theme: 'system' })]);
        expect(inputs).toEqual([{ theme: 'light', expected_version: 1 }, { theme: 'system', expected_version: 2 }]);
        expect(client.preferences?.theme).toBe('system');
        expect(client.user?.given_name).toBe('Jane');
    });
    it('applies a conflict snapshot but rejects the save and preserves newer values against older reads', async () => {
        const client = await authenticated();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ preferences: { ...state(3), locale: 'de' } }, 409))
            .mockResolvedValueOnce(response(state(2))));
        await expect(client.updatePreferences({ theme: 'light' })).rejects.toMatchObject({ status: 409, preferences: { version: 3 } });
        expect((await client.getPreferences()).version).toBe(3);
        expect(client.user?.locale).toBe('de');
    });
    it('does not mutate a new/logged-out account from an old response', async () => {
        const client = await authenticated();
        let done!: (value: Response) => void;
        vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { done = resolve; })));
        const pending = client.getPreferences();
        client.logout(); done(response(state(5)));
        await expect(pending).rejects.toMatchObject({ status: 401 });
        expect(client.user).toBeNull();
    });
    it('refreshes once on 401 and never tries to expand a 403 grant', async () => {
        const client = await authenticated();
        const fetcher = vi.fn().mockResolvedValueOnce(response({}, 401))
            .mockResolvedValueOnce(response({ access_token: 'new' })).mockResolvedValueOnce(response(state(2)))
            .mockResolvedValueOnce(response({}, 403));
        vi.stubGlobal('fetch', fetcher);
        await client.getPreferences();
        expect(fetcher.mock.calls[1][1].body).not.toContain('scope=');
        expect(fetcher.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
        await expect(client.updatePreferences({ theme: 'light' })).rejects.toMatchObject({ status: 403 });
        expect(fetcher).toHaveBeenCalledTimes(4);
    });
    it('isolates stored credentials by issuer and OAuth client', async () => {
        const a = new UsersauClient({ ...config, storage: 'localStorage' });
        await a.login();
        const codeState = new URL(window.location.href).searchParams.get('state')!;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ access_token: 'a' })).mockResolvedValueOnce(response({ sub: 'one' })));
        await a.handleCallback({ code: 'code', state: codeState });
        const b = new UsersauClient({ ...config, clientId: 'other', storage: 'localStorage' });
        expect(b.isAuthenticated).toBe(false);
        b.logout();
        expect(new UsersauClient({ ...config, storage: 'localStorage' }).isAuthenticated).toBe(true);
    });
});
