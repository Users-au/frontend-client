# Examples

This directory contains working examples for each supported framework.

> **To run:** build the library first with `npm run build`, then open in your browser or dev server.

## Files

| Example | Description |
|---------|-------------|
| [`vanilla.html`](./vanilla.html) | Plain HTML + ES module import |
| [`vue/`](./vue/) | Vue 3 app with `UsersauPlugin` + `useUsersau()` |
| [`react/`](./react/) | React app with `UsersauProvider` + `useUsersau()` |

## Configuration

Each example uses placeholder credentials. Replace:

```js
clientId: 'YOUR_CLIENT_ID'
host: 'https://auth.users.au'
redirectUri: 'http://localhost:PORT/...'
```

with your actual Users.au application credentials.
