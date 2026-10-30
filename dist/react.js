import { jsx as a } from "react/jsx-runtime";
import { createContext as i, useRef as f, useState as l, useEffect as d, useContext as p } from "react";
import { UsersauClient as g } from "./index.js";
const o = i(null);
function C({ config: s, children: e }) {
  const r = f(null);
  r.current || (r.current = new g(s));
  const t = r.current, [n, u] = l(t.state);
  return d(() => t.subscribe((c) => {
    u(c);
  }), [t]), /* @__PURE__ */ a(o.Provider, { value: { client: t, state: n }, children: e });
}
function P() {
  const s = p(o);
  if (!s)
    throw new Error(
      "[useUsersau] No UsersauContext found. Wrap your app with <UsersauProvider>."
    );
  const { client: e, state: r } = s;
  return {
    user: r.user,
    preferences: e.preferences,
    getPreferences: () => e.getPreferences(),
    updatePreferences: (t, n) => e.updatePreferences(t, n),
    isAuthenticated: r.isAuthenticated,
    isLoading: r.isLoading,
    error: r.error,
    tokens: r.tokens,
    login: () => e.login(),
    register: () => e.register(),
    handleCallback: (t) => e.handleCallback(t),
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
  P as useUsersau
};
//# sourceMappingURL=react.js.map
