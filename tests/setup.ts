import '@testing-library/jest-dom';

// Mock window.location for tests
Object.defineProperty(window, 'location', {
    writable: true,
    value: {
        href: 'http://localhost/',
        origin: 'http://localhost',
        search: '',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
    },
});

// Mock crypto.subtle for PKCE tests (jsdom doesn't have it)
if (!global.crypto.subtle) {
    Object.defineProperty(global.crypto, 'subtle', {
        value: {
            digest: async (_algorithm: string, data: BufferSource) => {
                // Simple hash mock — just returns the data bytes for testing
                const arr = new Uint8Array(data as ArrayBuffer);
                const result = new ArrayBuffer(32);
                const view = new Uint8Array(result);
                for (let i = 0; i < 32; i++) {
                    view[i] = arr[i % arr.length] ^ i;
                }
                return result;
            },
        },
    });
}
