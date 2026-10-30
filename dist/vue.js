import { inject as k, ref as n, getCurrentScope as U, onScopeDispose as h, readonly as o } from "vue";
import { UsersauClient as v } from "./index.js";
const g = Symbol("usersau"), P = {
  install(e, r) {
    const c = new v(r);
    e.provide(g, c);
  }
};
function T() {
  var d;
  const e = k(g);
  if (!e)
    throw new Error(
      "[useUsersau] No UsersauClient found. Did you install UsersauPlugin via app.use()?"
    );
  const r = e.state, c = n(e.preferences), u = n(r.user), a = n(r.isAuthenticated), i = n(r.isLoading), l = n(r.error), f = n(((d = r.tokens) == null ? void 0 : d.accessToken) ?? null), p = e.subscribe((s) => {
    var t;
    u.value = s.user, c.value = e.preferences, a.value = s.isAuthenticated, i.value = s.isLoading, l.value = s.error, f.value = ((t = s.tokens) == null ? void 0 : t.accessToken) ?? null;
  });
  return U() && h(p), {
    user: o(u),
    preferences: o(c),
    getPreferences: () => e.getPreferences(),
    updatePreferences: (s, t) => e.updatePreferences(s, t),
    isAuthenticated: o(a),
    isLoading: o(i),
    error: o(l),
    accessToken: o(f),
    login: () => e.login(),
    register: () => e.register(),
    handleCallback: (s) => e.handleCallback(s),
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
  P as UsersauPlugin,
  T as useUsersau
};
//# sourceMappingURL=vue.js.map
