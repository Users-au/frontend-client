# Changelog

## 2.1.0 - 2026-11-09

- Add server-side PAR helpers and branded account and logout contexts. The browser receives only the client ID and the short-lived request URI.

## 2.0.0 - 2026-10-30

- Transport standard sub/picture and complete scoped claims, with typed global locale/timezone/theme preferences.
- Add versioned getPreferences/updatePreferences and React/Vue bindings; serialize saves, preserve newer snapshots, and isolate storage/responses by issuer/client/account.
- Request preference scopes by default. Consume callback state once and omit raw upstream error bodies. Old unscoped token storage is not reused.
