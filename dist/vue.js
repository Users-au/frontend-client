import { inject as h, ref as o, readonly as r } from "vue";
import { UsersauClient as k } from "./index.js";
const f = Symbol("usersau"), b = {
  install(e, n) {
    const i = new k(n);
    e.provide(f, i);
  }
};
function v() {
  var d;
  const e = h(f);
  if (!e)
    throw new Error(
      "[useUsersau] No UsersauClient found. Did you install UsersauPlugin via app.use()?"
    );
  const n = e.state, i = o(n.user), u = o(n.isAuthenticated), a = o(n.isLoading), c = o(n.error), l = o(((d = n.tokens) == null ? void 0 : d.accessToken) ?? null), g = e.subscribe((s) => {
    var t;
    i.value = s.user, u.value = s.isAuthenticated, a.value = s.isLoading, c.value = s.error, l.value = ((t = s.tokens) == null ? void 0 : t.accessToken) ?? null;
  });
  return typeof window < "u" && import("vue").then(({ getCurrentInstance: s, onUnmounted: t }) => {
    s() && t(g);
  }), {
    user: r(i),
    isAuthenticated: r(u),
    isLoading: r(a),
    error: r(c),
    accessToken: r(l),
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
  b as UsersauPlugin,
  v as useUsersau
};
//# sourceMappingURL=vue.js.map
