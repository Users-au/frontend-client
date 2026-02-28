/**
 * PKCE (Proof Key for Code Exchange) helpers.
 * RFC 7636: https://datatracker.ietf.org/doc/html/rfc7636
 */

/** Generate a cryptographically random code verifier (43–128 chars) */
export function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

/** Derive the code challenge from the verifier using SHA-256 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(digest));
}

/** Generate a random state string for CSRF protection */
export function generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

function base64UrlEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
