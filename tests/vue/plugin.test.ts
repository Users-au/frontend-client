import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { UsersauPlugin, useUsersau } from '../../src/vue/plugin';
import type { UsersauConfig } from '../../src/core/types';

const testConfig: UsersauConfig = {
    clientId: 'test_client',
    host: 'https://auth.example.com',
    redirectUri: 'http://localhost/callback',
    storage: 'memory',
};

// Test component that uses the composable
const TestComponent = defineComponent({
    setup() {
        const auth = useUsersau();
        return { auth };
    },
    template: `
    <div>
      <span data-testid="is-authenticated">{{ auth.isAuthenticated }}</span>
      <span data-testid="user-name">{{ auth.user?.name ?? 'guest' }}</span>
      <button data-testid="login-btn" @click="auth.login()">Login</button>
      <button data-testid="logout-btn" @click="auth.logout()">Logout</button>
      <button data-testid="register-btn" @click="auth.register()">Register</button>
    </div>
  `,
});

describe('Vue UsersauPlugin + useUsersau()', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('throws when useUsersau() is called outside plugin context', () => {
        expect(() => {
            mount(TestComponent);
        }).toThrow('No UsersauClient found');
    });

    it('provides authentication state', () => {
        const wrapper = mount(TestComponent, {
            global: { plugins: [[UsersauPlugin, testConfig]] },
        });

        expect(wrapper.get('[data-testid="is-authenticated"]').text()).toBe('false');
        expect(wrapper.get('[data-testid="user-name"]').text()).toBe('guest');
    });

    it('triggers login() when login button is clicked', async () => {
        const wrapper = mount(TestComponent, {
            global: { plugins: [[UsersauPlugin, testConfig]] },
        });

        await wrapper.get('[data-testid="login-btn"]').trigger('click');
        // login() is async so we wait a tick
        await new Promise((r) => setTimeout(r, 50));
        expect(window.location.href).toContain('/oauth/authorize');
    });

    it('triggers logout() when logout button is clicked', async () => {
        const wrapper = mount(TestComponent, {
            global: { plugins: [[UsersauPlugin, testConfig]] },
        });

        await wrapper.get('[data-testid="logout-btn"]').trigger('click');
        expect(window.location.href).toContain('/logout');
    });

    it('triggers register() when register button is clicked', async () => {
        const wrapper = mount(TestComponent, {
            global: { plugins: [[UsersauPlugin, testConfig]] },
        });

        await wrapper.get('[data-testid="register-btn"]').trigger('click');
        expect(window.location.href).toContain('/register');
    });

    it('exposes the raw client instance', () => {
        const wrapper = mount(TestComponent, {
            global: { plugins: [[UsersauPlugin, testConfig]] },
        });

        const { auth } = wrapper.vm;
        expect(auth.client).toBeDefined();
        expect(typeof auth.client.login).toBe('function');
    });
});
