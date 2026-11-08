// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApplicationContextUrl, createPushedAuthorizationUrl } from '../../src/server';
const config = { host: 'https://identity.example', clientId: 'client', clientSecret: 'private-secret' };
const context = { context_id: 'app-a', branding: { name: 'Application A' }, links: { home_url: 'https://app.example/' } };
const parameters = { redirect_uri: 'https://app.example/callback', state: 's'.repeat(32), code_challenge: 'x'.repeat(43) };
const payload = { request_uri: `urn:ietf:params:oauth:request_uri:${'x'.repeat(64)}`, expires_in: 300 };
afterEach(() => vi.unstubAllGlobals());
describe('server pushed requests', () => {
    it('sends credentials/context privately and gives the browser only a handle', async () => {
        const fetcher = vi.fn().mockResolvedValue(Response.json(payload, { status: 201 }));
        vi.stubGlobal('fetch', fetcher);
        const url = await createPushedAuthorizationUrl(config, parameters, context);
        expect(url).toContain('https://identity.example/oauth/authorize?');
        expect(url).not.toContain('private-secret'); expect(url).not.toContain('Application');
        const [endpoint, request] = fetcher.mock.calls[0];
        expect(endpoint.toString()).toBe('https://identity.example/oauth/par');
        expect(request.redirect).toBe('error'); expect(request.cache).toBe('no-store');
        expect(request.headers.Authorization).toBe(`Basic ${btoa('client:private-secret')}`);
        expect(JSON.parse(request.body.get('context'))).toEqual(context);
        expect(request.body.get('code_challenge_method')).toBe('S256');
    });
    it('opens account and logout using fresh purpose-specific contexts', async () => {
        const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(payload, { status: 201 })));
        vi.stubGlobal('fetch', fetcher);
        for (const purpose of ['account', 'logout'] as const) {
            expect(await createApplicationContextUrl(config, purpose, context)).toContain(`/${purpose}?`);
            const request = fetcher.mock.calls.at(-1)![1];
            expect(request.body.get('purpose')).toBe(purpose);
            expect(request.body.has('redirect_uri')).toBe(false);
        }
    });
    it('refuses unsafe identity origins and browser execution before sending credentials', async () => {
        const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
        for (const host of ['http://identity.example', 'https://user:password@identity.example', 'https://identity.example/other', 'https://identity.example?x=1']) {
            await expect(createApplicationContextUrl({ ...config, host }, 'account', context)).rejects.toThrow();
        }
        vi.stubGlobal('window', {});
        await expect(createApplicationContextUrl(config, 'account', context)).rejects.toThrow('require a server');
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('rejects malformed/redirect responses without exposing provider response bodies', async () => {
        for (const status of [302, 400, 201]) {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ request_uri: 'https://attacker.example', error: 'private-response' }, { status })));
            await expect(createApplicationContextUrl(config, 'account', context)).rejects.toThrow('Users.au rejected the pushed request.');
        }
    });
});
