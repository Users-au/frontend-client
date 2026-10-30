# Identity profile and account preferences (client 2)

The public PKCE browser client shares the Auth contract with Laravel SDK 2.1 / Socialite provider 2. Its default scopes are openid/profile/email/preferences:read/preferences:write. Use public OAuth clients and explicitly allow the application origin and GET/PATCH /api/interface-preferences in the provider CORS policy. Never supply a client secret to this browser library. The confidential Next.js starter uses server-side sessions/credential storage instead.

normalizeUserInfo retains the fourteen standard profile claims, independently scoped email/phone/address, and urn:usersau:preferences. Identity is issuer + string sub; id/avatar are display aliases. Unknown fields and unsafe URLs are omitted. Missing optional fields remain absent. normalizePreferences checks subject, version, theme, locale syntax and IANA timezone. Locale maps to an application's supported catalogs; timezone controls display and system theme stays system per device.

client.getPreferences() fetches the confirmed snapshot. client.updatePreferences({theme: 'dark'}) sends only changed fields and the latest confirmed expected_version; an explicit expectedVersion is also accepted. Writes serialize. A 409 updates confirmed state and rejects with PreferencesError(status=409, preferences). 401 can refresh once, 403 never expands scope, and other failures must not be reported as a saved choice. Older versions and responses after logout/account changes do not overwrite state. Browser storage is namespaced by issuer and OAuth client; version 1 unscoped credentials are not migrated.

React and Vue useUsersau expose preferences, getPreferences and updatePreferences; client subscribers receive the same confirmed user state. Hydrate your UI from preferences without calling updatePreferences. Fetch on application entry/focus; retain confirmed data on background failures. Clean up focus listeners/subscriptions, and show an explicit error for a failed user save. Vue subscriptions follow their active effect scope.

```ts
const saved = await client.updatePreferences({ locale: 'zh-CN', timezone: 'Australia/Sydney' });
// Apply saved.theme, map saved.locale to your translations, format dates in saved.timezone.
```

Deploy the Auth authority first and reauthorize old grants for the new scopes. Build/package checks cover ESM/CJS exports and type declarations. Source dist artifacts are committed for GitHub installs; publishing to npm is a separate release action. Server-only consumers may import the pure normalization utilities from the root package without constructing a browser client.
