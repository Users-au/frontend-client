import { jsx as a } from "react/jsx-runtime";
import { createContext as i, useRef as l, useState as f, useEffect as d, useContext as U } from "react";
import { UsersauClient as b } from "./index.js";
const n = i(null);
function C({ config: s, children: e }) {
  const t = l(null);
  t.current || (t.current = new b(s));
  const r = t.current, [o, u] = f(r.state);
  return d(() => r.subscribe((c) => {
    u(c);
  }), [r]), /* @__PURE__ */ a(n.Provider, { value: { client: r, state: o }, children: e });
}
function k() {
  const s = U(n);
  if (!s)
    throw new Error(
      "[useUsersau] No UsersauContext found. Wrap your app with <UsersauProvider>."
    );
  const { client: e, state: t } = s;
  return {
    user: t.user,
    isAuthenticated: t.isAuthenticated,
    isLoading: t.isLoading,
    error: t.error,
    tokens: t.tokens,
    login: () => e.login(),
    register: () => e.register(),
    handleCallback: (r) => e.handleCallback(r),
    logout: () => e.logout(),
    account: () => e.account(),
    refreshToken: async () => {
      await e.refreshToken();
    },
    syncUser: () => e.syncUser(),
    client: e
  };
}
export {
  C as UsersauProvider,
  k as useUsersau
};
//# sourceMappingURL=react.js.map
