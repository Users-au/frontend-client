import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { UsersauProvider, useUsersau } from '../../src/react/index';
import type { UsersauConfig } from '../../src/core/types';

const testConfig: UsersauConfig = {
    clientId: 'test_client',
    host: 'https://auth.example.com',
    redirectUri: 'http://localhost/callback',
    storage: 'memory',
};

// Test component that uses the hook
function TestComponent() {
    const { isAuthenticated, user, login, logout, register, account } = useUsersau();
    return (
        <div>
            <span data-testid="is-authenticated">{String(isAuthenticated)}</span>
            <span data-testid="user-name">{user?.name ?? 'guest'}</span>
            <button data-testid="login-btn" onClick={() => login()}>Login</button>
            <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
            <button data-testid="register-btn" onClick={() => register()}>Register</button>
            <button data-testid="account-btn" onClick={() => account()}>Account</button>
        </div>
    );
}

function renderWithProvider(config = testConfig) {
    return render(
        <UsersauProvider config={config}>
            <TestComponent />
        </UsersauProvider>
    );
}

describe('React UsersauProvider + useUsersau()', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('throws when useUsersau() is called outside UsersauProvider', () => {
        // Suppress React error boundary output
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestComponent />)).toThrow('No UsersauContext found');
        spy.mockRestore();
    });

    it('renders initial unauthenticated state', () => {
        renderWithProvider();
        expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user-name').textContent).toBe('guest');
    });

    it('triggers login() on button click', async () => {
        renderWithProvider();
        await act(async () => {
            fireEvent.click(screen.getByTestId('login-btn'));
            // login() is async (generates PKCE) — wait for it to resolve
            await new Promise((r) => setTimeout(r, 50));
        });
        expect(window.location.href).toContain('/oauth/authorize');
    });

    it('triggers logout() on button click', async () => {
        renderWithProvider();
        // Reset href, then click logout
        window.location.href = 'http://localhost/';
        await act(async () => {
            fireEvent.click(screen.getByTestId('logout-btn'));
        });
        expect(window.location.href).toContain('/logout');
    });

    it('triggers register() on button click', async () => {
        renderWithProvider();
        await act(async () => {
            fireEvent.click(screen.getByTestId('register-btn'));
        });
        expect(window.location.href).toContain('/register');
    });

    it('does not recreate client on re-render', () => {
        const { rerender } = renderWithProvider();
        const firstHref = window.location.href;

        rerender(
            <UsersauProvider config={testConfig}>
                <TestComponent />
            </UsersauProvider>
        );

        // No crash = client instance was stable
        expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });

    it('updates UI when client state changes (subscribe)', async () => {
        let capturedClient: ReturnType<typeof useUsersau>['client'] | undefined;

        function ClientCapture() {
            const { client, isAuthenticated } = useUsersau();
            capturedClient = client;
            return <span data-testid="auth">{String(isAuthenticated)}</span>;
        }

        render(
            <UsersauProvider config={testConfig}>
                <ClientCapture />
            </UsersauProvider>
        );

        expect(screen.getByTestId('auth').textContent).toBe('false');

        // Simulate subscriber notification
        await act(async () => {
            capturedClient?.logout(); // triggers state change
        });

        expect(screen.getByTestId('auth').textContent).toBe('false');
    });
});
