import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../../src/core/pkce';

describe('PKCE helpers', () => {
    describe('generateCodeVerifier', () => {
        it('returns a string', () => {
            const verifier = generateCodeVerifier();
            expect(typeof verifier).toBe('string');
        });

        it('returns at least 43 characters (RFC 7636 minimum)', () => {
            const verifier = generateCodeVerifier();
            expect(verifier.length).toBeGreaterThanOrEqual(43);
        });

        it('only contains URL-safe base64 characters', () => {
            const verifier = generateCodeVerifier();
            expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
        });

        it('generates unique values each call', () => {
            const v1 = generateCodeVerifier();
            const v2 = generateCodeVerifier();
            expect(v1).not.toBe(v2);
        });
    });

    describe('generateCodeChallenge', () => {
        it('returns a non-empty string', async () => {
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            expect(typeof challenge).toBe('string');
            expect(challenge.length).toBeGreaterThan(0);
        });

        it('only contains URL-safe base64 characters', async () => {
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
        });

        it('returns the same challenge for the same verifier', async () => {
            const verifier = generateCodeVerifier();
            const c1 = await generateCodeChallenge(verifier);
            const c2 = await generateCodeChallenge(verifier);
            expect(c1).toBe(c2);
        });

        it('returns different challenge for different verifiers', async () => {
            const c1 = await generateCodeChallenge('verifier-one-abc123');
            const c2 = await generateCodeChallenge('verifier-two-xyz789');
            expect(c1).not.toBe(c2);
        });
    });

    describe('generateState', () => {
        it('returns a non-empty string', () => {
            const state = generateState();
            expect(typeof state).toBe('string');
            expect(state.length).toBeGreaterThan(0);
        });

        it('generates unique values each call', () => {
            const s1 = generateState();
            const s2 = generateState();
            expect(s1).not.toBe(s2);
        });

        it('only contains URL-safe characters', () => {
            const state = generateState();
            expect(state).toMatch(/^[A-Za-z0-9\-_]+$/);
        });
    });
});
