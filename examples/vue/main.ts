// Vue 3 example — main.ts
// Run: `npm run build` in project root, then open this via a local dev server.
//
// In a real project:
//   import { UsersauPlugin } from '@users-au/client/vue'

import { createApp } from 'vue';
import { UsersauPlugin } from '../../dist/vue.js';
import App from './App.vue';

const app = createApp(App);

app.use(UsersauPlugin, {
    clientId: 'YOUR_CLIENT_ID',       // Replace with your Users.au client ID
    host: 'https://auth.users.au',     // Replace with your Users.au host
    redirectUri: `${window.location.origin}/examples/vue/index.html`,
    afterLoginUrl: '/examples/vue/index.html',
    afterLogoutUrl: '/examples/vue/index.html',
});

app.mount('#app');
