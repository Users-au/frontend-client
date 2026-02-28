/**
 * PKCE (Proof Key for Code Exchange) helpers.
 * RFC 7636: https://datatracker.ietf.org/doc/html/rfc7636
 */
/** Generate a cryptographically random code verifier (43–128 chars) */
export declare function generateCodeVerifier(): string;
/** Derive the code challenge from the verifier using SHA-256 */
export declare function generateCodeChallenge(verifier: string): Promise<string>;
/** Generate a random state string for CSRF protection */
export declare function generateState(): string;
