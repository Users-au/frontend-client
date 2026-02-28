<template>
  <div class="container">
    <h1>Users.au — Vue 3 Example</h1>
    <p class="subtitle">Using <code>UsersauPlugin</code> + <code>useUsersau()</code></p>

    <div v-if="isLoading" class="card">Processing login…</div>

    <div v-else-if="error" class="card error">
      <p>Authentication failed: {{ error.message }}</p>
      <button class="btn-secondary" @click="clearError">Dismiss</button>
    </div>

    <div v-else-if="isAuthenticated" class="card">
      <img v-if="user?.avatar" :src="user.avatar" :alt="user.name" class="avatar" />
      <h2>{{ user?.name }}</h2>
      <p class="email">{{ user?.email }}</p>
      <div class="badge authed">Authenticated ✓</div>

      <div class="btn-group">
        <button class="btn-secondary" @click="account">Manage Account</button>
        <button class="btn-danger" @click="logout">Logout</button>
      </div>
    </div>

    <div v-else class="card">
      <div class="badge guest">Not authenticated</div>
      <div class="btn-group">
        <button class="btn-primary" @click="login">Login with Users.au</button>
        <button class="btn-secondary" @click="register">Register with Users.au</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUsersau } from '../../dist/vue.js';

const { user, isAuthenticated, isLoading, error, login, logout, register, account, handleCallback } = useUsersau();

const clearError = () => {
  // Navigate away from callback URL to clear the error
  history.replaceState({}, '', location.pathname);
  location.reload();
};

// Handle OAuth callback on mount if code is present in URL
onMounted(async () => {
  const params = new URLSearchParams(location.search);
  if (params.has('code')) {
    try {
      await handleCallback();
    } catch (err) {
      console.error('Callback failed:', err);
      history.replaceState({}, '', location.pathname);
    }
  }
});
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f0f4f8;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.container { width: 100%; max-width: 440px; padding: 1rem; }
h1 { font-size: 1.5rem; margin-bottom: 0.25rem; color: #1a202c; }
.subtitle { color: #718096; font-size: 0.875rem; margin-bottom: 1.5rem; }
code { background: #edf2f7; padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.8rem; }
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,.10);
  padding: 2rem;
  text-align: center;
}
.card.error { border: 1px solid #fc8181; }
.avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; }
h2 { font-size: 1.2rem; font-weight: 600; color: #2d3748; }
.email { color: #718096; font-size: 0.875rem; margin: 0.25rem 0 1rem; }
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.badge.authed { background: #c6f6d5; color: #22543d; }
.badge.guest { background: #fed7d7; color: #742a2a; }
.btn-group { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
button {
  padding: 0.75rem 1.5rem; border-radius: 8px; border: none;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity .15s;
}
button:hover { opacity: 0.85; }
.btn-primary { background: #4f46e5; color: #fff; }
.btn-secondary { background: #e2e8f0; color: #2d3748; }
.btn-danger { background: #fc8181; color: #fff; }
</style>
