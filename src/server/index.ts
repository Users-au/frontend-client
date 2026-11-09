/** Server-only confidential-client helpers. Never import credentials into browser bundles. */
export interface ApplicationContext {
    context_id: string;
    branding: { name: string; logo_url?: string; logo_dark_url?: string; favicon_url?: string; theme_color?: string };
    links: { home_url: string; support_url?: string; logout_url?: string };
}
export interface ConfidentialClientConfig {
    host: string;
    clientId: string;
    clientSecret: string;
}
export interface PushedAuthorizationParameters {
    redirect_uri: string;
    state: string;
    code_challenge: string;
    scope?: string;
}

async function push(config: ConfidentialClientConfig, endpoint: string, entry: string,
    parameters: Record<string, string>, context: ApplicationContext): Promise<string> {
    if (typeof window !== 'undefined') throw new Error('Confidential Users.au requests require a server.');
    let origin: URL;
    try { origin = new URL(config.host); } catch { throw new Error('A valid HTTPS Users.au origin is required.'); }
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' ||
        !config.clientId || !config.clientSecret) throw new Error('A valid HTTPS Users.au origin and client credentials are required.');
    const credentials = Array.from(new TextEncoder().encode(`${config.clientId}:${config.clientSecret}`), byte => String.fromCharCode(byte)).join('');
    let response: Response;
    try {
        response = await fetch(new URL(endpoint, origin), {
            method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit',
            signal: AbortSignal.timeout(15000),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', Authorization: `Basic ${btoa(credentials)}` },
            body: new URLSearchParams({ ...parameters, client_id: config.clientId, context: JSON.stringify(context) }),
        });
    } catch { throw new Error('Users.au is temporarily unavailable.'); }
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new Error('Users.au rejected the pushed request.'); }
    const uri = payload && typeof payload === 'object' && 'request_uri' in payload ? payload.request_uri : null;
    if (response.status !== 201 || typeof uri !== 'string' || !/^urn:ietf:params:oauth:request_uri:[A-Za-z0-9_-]{43,128}$/.test(uri)) {
        throw new Error('Users.au rejected the pushed request.');
    }
    const url = new URL(entry, origin);
    url.search = new URLSearchParams({ client_id: config.clientId, request_uri: uri }).toString();
    return url.toString();
}

export function createPushedAuthorizationUrl(config: ConfidentialClientConfig, parameters: PushedAuthorizationParameters,
    context: ApplicationContext): Promise<string> {
    return push(config, '/oauth/par', '/oauth/authorize', {
        ...parameters, scope: parameters.scope ?? 'openid profile email', response_type: 'code', code_challenge_method: 'S256',
    }, context);
}

/** Creates appearance/navigation context only. Auth still checks its own signed-in session. */
export function createApplicationContextUrl(config: ConfidentialClientConfig, purpose: 'account' | 'logout',
    context: ApplicationContext): Promise<string> {
    return push(config, '/oauth/context', `/${purpose}`, { purpose }, context);
}
