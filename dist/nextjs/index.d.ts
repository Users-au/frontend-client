/**
 * @users-au/client — Next.js integration
 *
 * This module re-exports the core `UsersauClient` with SSR-safe defaults.
 *
 * ## Recommended Pattern
 *
 * Because Next.js renders on the server, the OAuth redirect flow must only run
 * in the browser. The recommended approach is:
 *
 * 1. Create a singleton client in a context provider (client component).
 * 2. Use the React integration from `@users-au/client/react`.
 * 3. Create a dedicated `/app/auth/callback/page.tsx` that calls `handleCallback()`.
 *
 * ### BFF Note (when `client_secret` is required)
 *
 * If your Users.au application requires a `client_secret`, you should perform
 * the token exchange server-side (BFF pattern). Create an API route:
 *
 * ```ts
 * // app/api/auth/callback/route.ts
 * import { NextRequest, NextResponse } from 'next/server'
 *
 * export async function GET(req: NextRequest) {
 *   const code = req.nextUrl.searchParams.get('code')
 *   const body = new URLSearchParams({
 *     grant_type: 'authorization_code',
 *     client_id: process.env.USERSAU_CLIENT_ID!,
 *     client_secret: process.env.USERSAU_CLIENT_SECRET!,
 *     code: code!,
 *     redirect_uri: process.env.USERSAU_REDIRECT_URI!,
 *   })
 *   const tokenRes = await fetch(`${process.env.USERSAU_HOST}/oauth/token`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 *     body: body.toString(),
 *   })
 *   const tokens = await tokenRes.json()
 *   // Set session cookie, then redirect
 *   const response = NextResponse.redirect(new URL('/', req.url))
 *   response.cookies.set('access_token', tokens.access_token, { httpOnly: true })
 *   return response
 * }
 * ```
 *
 * In this BFF pattern you don't need PKCE (the secret replaces it).
 * Use PKCE (the default in this library) when there is no `client_secret`.
 */
export { UsersauClient } from '../core/UsersauClient';
export { UsersauProvider, useUsersau } from '../react/index';
export type { UsersauProviderProps, UseUsersauReturn } from '../react/index';
export type { UsersauConfig, UsersauUser, UsersauTokens, UsersauState, } from '../core/types';
