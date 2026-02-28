# Users.au Frontend Client

[![npm version](https://img.shields.io/npm/v/@users-au/client.svg)](https://www.npmjs.com/package/@users-au/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official frontend JavaScript/TypeScript client for [Users.au](https://users.au) OAuth 2.0 authentication. Works with **Vanilla JS**, **Vue 3**, **React**, and **Next.js**.

Mirrors the functionality of the [users-au/laravel-client](https://github.com/Users-au/laravel-client) PHP package.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage — Vanilla JS / TypeScript](#usage--vanilla-js--typescript)
- [Usage — Vue 3](#usage--vue-3)
- [Usage — React](#usage--react)
- [Usage — Next.js](#usage--nextjs)
- [API Reference](#api-reference)
- [OAuth 2.0 Flow Overview](#oauth-20-flow-overview)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- 🔐 **OAuth 2.0 + PKCE** — Secure authentication without exposing a client secret
- 👤 **User Management** — Fetches and caches user profile automatically
- 🔄 **Token Management** — Access & refresh token handling with auto-refresh
- 💾 **Flexible Storage** — `localStorage`, `sessionStorage`, or in-memory (SSR safe)
- 🎨 **Framework Agnostic** — Core + first-class Vue 3, React, and Next.js integrations
- 🚪 **Single Sign-Out** — Coordinated logout across your app and Users.au

---

## Installation

```bash
npm install @users-au/client
```

### Peer Dependencies

Install only what you need:

```bash
# For Vue 3
npm install vue

# For React / Next.js
npm install react react-dom
```

---

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientId` | `string` | **required** | Your Users.au OAuth client ID |
| `host` | `string` | **required** | Users.au host URL (e.g. `https://auth.users.au`) |
| `redirectUri` | `string` | **required** | OAuth redirect URI registered with Users.au |
| `afterLoginUrl` | `string` | `'/'` | Redirect URL after successful login |
| `afterLogoutUrl` | `string` | `'/'` | Redirect URL after logout |
| `afterRegisterUrl` | `string` | `'/'` | Redirect URL after registration |
| `scopes` | `string[]` | `['openid', 'profile', 'email']` | OAuth scopes to request |
| `storage` | `'localStorage' \| 'sessionStorage' \| 'memory'` | `'localStorage'` | Token storage strategy |

---

## Usage — Vanilla JS / TypeScript

```ts
import { UsersauClient } from '@users-au/client';

const client = new UsersauClient({
  clientId: 'your_client_id',
  host: 'https://auth.users.au',
  redirectUri: 'https://yourapp.com/auth/callback',
  afterLoginUrl: '/dashboard',
  afterLogoutUrl: '/',
});

// Login
document.getElementById('login-btn')?.addEventListener('click', () => {
  client.login();
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
  client.logout();
});

// Register
document.getElementById('register-btn')?.addEventListener('click', () => {
  client.register();
});

// Manage account
document.getElementById('account-btn')?.addEventListener('click', () => {
  client.account();
});

// On your callback page (https://yourapp.com/auth/callback)
await client.handleCallback();

// Check auth state
console.log(client.isAuthenticated);  // true | false
console.log(client.user);             // UsersauUser | null
console.log(client.accessToken);      // string | null

// Subscribe to state changes
const unsubscribe = client.subscribe((state) => {
  console.log('Auth state changed:', state);
});
```

---

## Usage — Vue 3

### 1. Install the plugin (`main.ts`)

```ts
import { createApp } from 'vue';
import { UsersauPlugin } from '@users-au/client/vue';
import App from './App.vue';

const app = createApp(App);

app.use(UsersauPlugin, {
  clientId: 'your_client_id',
  host: 'https://auth.users.au',
  redirectUri: 'https://yourapp.com/auth/callback',
  afterLoginUrl: '/dashboard',
});

app.mount('#app');
```

### 2. Use the composable

```vue
<script setup lang="ts">
import { useUsersau } from '@users-au/client/vue';

const { user, isAuthenticated, isLoading, login, logout, register, account } = useUsersau();
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="isAuthenticated">
    <p>Welcome, {{ user?.name }}!</p>
    <img v-if="user?.avatar" :src="user.avatar" :alt="user.name" />
    <button @click="account">Manage Account</button>
    <button @click="logout">Logout</button>
  </div>
  <div v-else>
    <button @click="login">Login with Users.au</button>
    <button @click="register">Register with Users.au</button>
  </div>
</template>
```

### 3. Callback page (`/auth/callback`)

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsersau } from '@users-au/client/vue';

const { handleCallback, error } = useUsersau();
const router = useRouter();

onMounted(async () => {
  await handleCallback(); // automatically redirects after success
});
</script>

<template>
  <div v-if="error">Authentication failed: {{ error.message }}</div>
  <div v-else>Processing login...</div>
</template>
```

---

## Usage — React

### 1. Wrap your app with the provider

```tsx
// app.tsx
import { UsersauProvider } from '@users-au/client/react';

export default function App() {
  return (
    <UsersauProvider
      config={{
        clientId: 'your_client_id',
        host: 'https://auth.users.au',
        redirectUri: 'https://yourapp.com/auth/callback',
        afterLoginUrl: '/dashboard',
      }}
    >
      <MyApp />
    </UsersauProvider>
  );
}
```

### 2. Use the hook

```tsx
import { useUsersau } from '@users-au/client/react';

export function Navbar() {
  const { user, isAuthenticated, login, logout, register, account } = useUsersau();

  if (isAuthenticated) {
    return (
      <nav>
        <span>Welcome, {user?.name}</span>
        <button onClick={account}>Manage Account</button>
        <button onClick={logout}>Logout</button>
      </nav>
    );
  }

  return (
    <nav>
      <button onClick={login}>Login with Users.au</button>
      <button onClick={register}>Register with Users.au</button>
    </nav>
  );
}
```

### 3. Callback page

```tsx
// pages/auth/callback.tsx (or app/auth/callback/page.tsx)
import { useEffect } from 'react';
import { useUsersau } from '@users-au/client/react';

export default function CallbackPage() {
  const { handleCallback, isLoading, error } = useUsersau();

  useEffect(() => {
    handleCallback(); // automatically redirects after success
  }, []);

  if (error) return <p>Authentication failed: {error.message}</p>;
  return <p>Processing login...</p>;
}
```

---

## Usage — Next.js

The `@users-au/client/nextjs` entry re-exports everything from the React integration with SSR-safe defaults (uses memory storage on the server).

```tsx
// app/providers.tsx  ('use client')
'use client';
import { UsersauProvider } from '@users-au/client/nextjs';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UsersauProvider
      config={{
        clientId: process.env.NEXT_PUBLIC_USERSAU_CLIENT_ID!,
        host: process.env.NEXT_PUBLIC_USERSAU_HOST!,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }}
    >
      {children}
    </UsersauProvider>
  );
}
```

```tsx
// app/auth/callback/page.tsx  ('use client')
'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUsersau } from '@users-au/client/nextjs';

export default function CallbackPage() {
  const { handleCallback, error } = useUsersau();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state) {
      handleCallback({ code, state });
    }
  }, [searchParams]);

  if (error) return <p>Authentication failed: {error.message}</p>;
  return <p>Processing login...</p>;
}
```

#### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_USERSAU_CLIENT_ID="your_client_id"
NEXT_PUBLIC_USERSAU_HOST="https://auth.users.au"
NEXT_PUBLIC_APP_URL="https://yourapp.com"
```

> **Using a client secret?** See the [BFF pattern](src/nextjs/index.ts) for performing the token exchange server-side in a Next.js API route.

---

## API Reference

### `UsersauClient`

| Method | Returns | Description |
|--------|---------|-------------|
| `login()` | `Promise<void>` | Redirect to Users.au authorization |
| `register()` | `void` | Redirect to Users.au registration |
| `handleCallback(params?)` | `Promise<UsersauUser>` | Exchange code for tokens, fetch user |
| `logout()` | `void` | Clear tokens, redirect to Users.au logout |
| `account()` | `void` | Redirect to Users.au account page |
| `refreshToken()` | `Promise<UsersauTokens>` | Refresh access token |
| `syncUser()` | `Promise<UsersauUser>` | Re-fetch user info from Users.au |
| `subscribe(fn)` | `() => void` | Subscribe to state changes (returns unsubscribe) |

| Property | Type | Description |
|----------|------|-------------|
| `user` | `UsersauUser \| null` | Current authenticated user |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `accessToken` | `string \| null` | Current access token |
| `state` | `UsersauState` | Full reactive state snapshot |

### `UsersauUser`

```ts
interface UsersauUser {
  id: string;
  nickname?: string;
  name: string;
  email: string;
  avatar?: string;
}
```

---

## OAuth 2.0 Flow Overview

```
User clicks Login
      │
      ▼
client.login()  ──generates PKCE verifier + challenge──►  {host}/oauth/authorize
                                                                  │
                                                            User authenticates
                                                                  │
                                                          Redirect to redirectUri
                                                          ?code=...&state=...
                                                                  │
      ◄──────────────────────────────────────────────────────────┘
      │
client.handleCallback()
      │
      ├── POST {host}/oauth/token  (code + verifier)
      │         └── returns access_token, refresh_token
      │
      └── GET {host}/api/user  (Bearer token)
                └── returns user profile
                      │
                      └── Redirect to afterLoginUrl
```

---

## Troubleshooting

**`OAuth state mismatch` error**
The `state` parameter returned in the callback doesn't match what was stored. Ensure cookies/localStorage are not blocked and the login flow was initiated from the same browser session.

**`No PKCE verifier found` error**
The PKCE code verifier wasn't found in storage. This can happen if:
- The user opened the callback URL in a different browser/tab
- Storage was cleared between login and callback
- Third-party cookie blocking affected `localStorage`

**SSR / Next.js hydration issues**
Use `'use client'` on components that call `useUsersau()`. The `storage: 'memory'` option prevents server-side storage access errors.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © [Users.au](https://users.au)
