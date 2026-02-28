// React example — main.tsx
// Run: `npm run build` in project root, then open this via a local dev server.
//
// In a real project:
//   import { UsersauProvider } from '@users-au/client/react'

import React from 'react';
import { createRoot } from 'react-dom/client';
import { UsersauProvider } from '../../dist/react.js';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <UsersauProvider
            config={{
                clientId: 'YOUR_CLIENT_ID',      // Replace with your Users.au client ID
                host: 'https://auth.users.au',    // Replace with your Users.au host
                redirectUri: `${window.location.origin}/examples/react/index.html`,
                afterLoginUrl: '/examples/react/index.html',
                afterLogoutUrl: '/examples/react/index.html',
            }}
        >
            <App />
        </UsersauProvider>
    </React.StrictMode>
);
