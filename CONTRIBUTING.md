# Users.au Frontend Client — Development Notes

## Project Structure

```
src/
├── core/
│   ├── UsersauClient.ts   # Main OAuth client class
│   ├── pkce.ts            # PKCE helpers (Web Crypto API)
│   ├── storage.ts         # Token storage abstraction
│   └── types.ts           # Shared TypeScript types
├── vue/
│   ├── plugin.ts          # UsersauPlugin + useUsersau() composable
│   └── index.ts           # Vue entry point
├── react/
│   └── index.tsx          # UsersauProvider + useUsersau() hook
├── nextjs/
│   └── index.ts           # Next.js re-export with BFF docs
└── index.ts               # Core entry point

dist/                       # Built output (generated)
├── index.js / index.cjs
├── vue.js / vue.cjs
├── react.js / react.cjs
└── nextjs.js / nextjs.cjs
```

## Development

```bash
npm install
npm run build      # Build all bundles
npm run typecheck  # Type checking only
npm run dev        # Watch mode
```

## Publishing

```bash
npm run build
npm publish --access public
```
