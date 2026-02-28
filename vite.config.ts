import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        vue(),
        dts({
            include: ['src'],
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                vue: resolve(__dirname, 'src/vue/index.ts'),
                react: resolve(__dirname, 'src/react/index.tsx'),
                nextjs: resolve(__dirname, 'src/nextjs/index.ts'),
            },
            formats: ['es', 'cjs'],
            fileName: (format, entryName) =>
                format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
        },
        rollupOptions: {
            external: ['vue', 'react', 'react/jsx-runtime', 'react-dom'],
            output: {
                globals: {
                    vue: 'Vue',
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
        sourcemap: true,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
        },
    },
});
