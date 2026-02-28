var w = Object.defineProperty;
var k = (s, e, t) => e in s ? w(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var a = (s, e, t) => k(s, typeof e != "symbol" ? e + "" : e, t);
function p() {
  const s = new Uint8Array(32);
  return crypto.getRandomValues(s), u(s);
}
async function S(s) {
  const t = new TextEncoder().encode(s), r = await crypto.subtle.digest("SHA-256", t);
  return u(new Uint8Array(r));
}
function U() {
  const s = new Uint8Array(16);
  return crypto.getRandomValues(s), u(s);
}
function u(s) {
  return btoa(String.fromCharCode(...s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
const o = {
  tokens: "usersau_tokens",
  user: "usersau_user",
  pkceVerifier: "usersau_pkce_verifier",
  oauthState: "usersau_oauth_state",
  flow: "usersau_flow"
};
class _ {
  constructor(e = "localStorage") {
    a(this, "store");
    if (e === "memory")
      this.store = {};
    else
      try {
        typeof window > "u" ? this.store = {} : this.store = e === "sessionStorage" ? window.sessionStorage : window.localStorage;
      } catch {
        this.store = {};
      }
  }
  // ── Tokens ──────────────────────────────────────────────────────────────────
  setTokens(e) {
    this.store[o.tokens] = JSON.stringify(e);
  }
  getTokens() {
    const e = this.store[o.tokens];
    if (!e) return null;
    try {
      return JSON.parse(e);
    } catch {
      return null;
    }
  }
  clearTokens() {
    delete this.store[o.tokens];
  }
  // ── User ────────────────────────────────────────────────────────────────────
  setUser(e) {
    this.store[o.user] = JSON.stringify(e);
  }
  getUser() {
    const e = this.store[o.user];
    if (!e) return null;
    try {
      return JSON.parse(e);
    } catch {
      return null;
    }
  }
  clearUser() {
    delete this.store[o.user];
  }
  // ── PKCE / OAuth helpers ─────────────────────────────────────────────────────
  setPkceVerifier(e) {
    this.store[o.pkceVerifier] = e;
  }
  getPkceVerifier() {
    return this.store[o.pkceVerifier] ?? null;
  }
  clearPkceVerifier() {
    delete this.store[o.pkceVerifier];
  }
  setOauthState(e) {
    this.store[o.oauthState] = e;
  }
  getOauthState() {
    return this.store[o.oauthState] ?? null;
  }
  clearOauthState() {
    delete this.store[o.oauthState];
  }
  setFlow(e) {
    this.store[o.flow] = e;
  }
  getFlow() {
    return this.store[o.flow] ?? "login";
  }
  clearFlow() {
    delete this.store[o.flow];
  }
  // ── Clear all ────────────────────────────────────────────────────────────────
  clearAll() {
    this.clearTokens(), this.clearUser(), this.clearPkceVerifier(), this.clearOauthState(), this.clearFlow();
  }
}
class m {
  constructor(e) {
    a(this, "config");
    a(this, "storage");
    a(this, "_state");
    a(this, "listeners", []);
    this.config = {
      clientId: e.clientId,
      host: e.host.replace(/\/$/, ""),
      // strip trailing slash
      redirectUri: e.redirectUri,
      afterLoginUrl: e.afterLoginUrl ?? "/",
      afterLogoutUrl: e.afterLogoutUrl ?? "/",
      afterRegisterUrl: e.afterRegisterUrl ?? "/",
      scopes: e.scopes ?? ["openid", "profile", "email"],
      storage: e.storage ?? "localStorage"
    }, this.storage = new _(this.config.storage);
    const t = this.storage.getTokens(), r = this.storage.getUser();
    this._state = {
      user: r,
      tokens: t,
      isAuthenticated: !!t && !!r,
      isLoading: !1,
      error: null
    };
  }
  // ── Public state ─────────────────────────────────────────────────────────────
  get state() {
    return this._state;
  }
  get user() {
    return this._state.user;
  }
  get isAuthenticated() {
    return this._state.isAuthenticated;
  }
  get accessToken() {
    var e;
    return ((e = this._state.tokens) == null ? void 0 : e.accessToken) ?? null;
  }
  // ── State subscriptions ──────────────────────────────────────────────────────
  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(e) {
    return this.listeners.push(e), () => {
      this.listeners = this.listeners.filter((t) => t !== e);
    };
  }
  setState(e) {
    this._state = { ...this._state, ...e }, this.listeners.forEach((t) => t(this._state));
  }
  // ── Auth flows ───────────────────────────────────────────────────────────────
  /**
   * Initiates the OAuth login flow.
   * Mirrors PHP: AuthController::redirect()
   *
   * Generates PKCE verifier + challenge, stores state, then redirects the
   * browser to `{host}/oauth/authorize`.
   */
  async login() {
    const e = p(), t = await S(e), r = U();
    this.storage.setPkceVerifier(e), this.storage.setOauthState(r), this.storage.setFlow("login");
    const i = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scopes.join(" "),
      state: r,
      code_challenge: t,
      code_challenge_method: "S256"
    });
    window.location.href = `${this.config.host}/oauth/authorize?${i}`;
  }
  /**
   * Initiates the OAuth registration flow.
   * Mirrors PHP: AuthController::register()
   */
  register() {
    this.storage.setFlow("register");
    const e = new URLSearchParams({
      redirect_uri: this.config.redirectUri
    });
    window.location.href = `${this.config.host}/register?${e}`;
  }
  /**
   * Handles the OAuth callback (code exchange + user fetch).
   * Mirrors PHP: AuthController::callback()
   *
   * Call this method on the page that corresponds to your `redirectUri`.
   * Accepts query params from the current URL automatically, or pass them
   * explicitly (useful in Next.js where you have the search params).
   *
   * @returns The authenticated user
   */
  async handleCallback(e) {
    this.setState({ isLoading: !0, error: null });
    try {
      const t = e ? new URLSearchParams(e) : new URLSearchParams(window.location.search), r = t.get("code"), i = t.get("state"), n = t.get("error");
      if (n)
        throw new Error(`OAuth error: ${n} — ${t.get("error_description") ?? ""}`);
      if (!r)
        throw new Error("No authorization code found in callback URL.");
      const c = this.storage.getOauthState();
      if (c && i !== c)
        throw new Error("OAuth state mismatch. Possible CSRF attack.");
      const f = this.storage.getPkceVerifier();
      if (!f)
        throw new Error("No PKCE verifier found. Did login() run in the same browser?");
      const h = await this.exchangeCodeForTokens(r, f), l = await this.fetchUserInfo(h.accessToken);
      this.storage.setTokens(h), this.storage.setUser(l), this.storage.clearPkceVerifier(), this.storage.clearOauthState();
      const g = this.storage.getFlow();
      this.storage.clearFlow(), this.setState({ user: l, tokens: h, isAuthenticated: !0, isLoading: !1 });
      const d = g === "register" ? this.config.afterRegisterUrl : this.config.afterLoginUrl;
      return typeof window < "u" && !e && (window.location.href = d), l;
    } catch (t) {
      const r = t instanceof Error ? t : new Error(String(t));
      throw this.setState({ isLoading: !1, error: r }), r;
    }
  }
  /**
   * Logs the user out locally and redirects to Users.au single sign-out.
   * Mirrors PHP: AuthController::logout()
   */
  logout() {
    this.storage.clearAll(), this.setState({ user: null, tokens: null, isAuthenticated: !1, error: null });
    const e = new URLSearchParams({
      continue: this.resolveUrl(this.config.afterLogoutUrl)
    });
    window.location.href = `${this.config.host}/logout?${e}`;
  }
  /**
   * Redirects the authenticated user to their Users.au account management page.
   * Mirrors PHP: AuthController::account()
   */
  account() {
    if (!this._state.isAuthenticated) {
      this.login();
      return;
    }
    window.location.href = `${this.config.host}/account`;
  }
  /**
   * Refresh the access token using the stored refresh token.
   * Call this when you receive a 401 response from your API.
   */
  async refreshToken() {
    const e = this.storage.getTokens();
    if (!(e != null && e.refreshToken))
      throw new Error("No refresh token available. User must log in again.");
    const t = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      refresh_token: e.refreshToken
    }), r = await fetch(`${this.config.host}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: t.toString()
    });
    if (!r.ok)
      throw this.storage.clearAll(), this.setState({ user: null, tokens: null, isAuthenticated: !1 }), new Error(`Token refresh failed (${r.status}).`);
    const i = await r.json(), n = this.parseTokenResponse(i);
    return this.storage.setTokens(n), this.setState({ tokens: n }), n;
  }
  /**
   * Fetch the current user's info from Users.au.
   * Useful for refreshing profile data without re-authenticating.
   */
  async syncUser() {
    const e = this.accessToken;
    if (!e) throw new Error("Not authenticated.");
    const t = await this.fetchUserInfo(e);
    return this.storage.setUser(t), this.setState({ user: t }), t;
  }
  // ── Private helpers ──────────────────────────────────────────────────────────
  async exchangeCodeForTokens(e, t) {
    const r = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      code: e,
      redirect_uri: this.config.redirectUri,
      code_verifier: t
    }), i = await fetch(`${this.config.host}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: r.toString()
    });
    if (!i.ok) {
      const c = await i.text().catch(() => "");
      throw new Error(`Token exchange failed (${i.status}): ${c}`);
    }
    const n = await i.json();
    return this.parseTokenResponse(n);
  }
  async fetchUserInfo(e) {
    const t = await fetch(`${this.config.host}/api/user`, {
      headers: { Authorization: `Bearer ${e}` }
    });
    if (!t.ok)
      throw new Error(`Failed to fetch user info (${t.status}).`);
    const r = await t.json();
    return {
      id: r.id,
      nickname: r.nickname,
      name: r.name,
      email: r.email,
      avatar: r.avatar
    };
  }
  parseTokenResponse(e) {
    return {
      accessToken: e.access_token,
      refreshToken: e.refresh_token,
      expiresAt: e.expires_in ? Date.now() + e.expires_in * 1e3 : void 0,
      tokenType: e.token_type,
      scope: e.scope
    };
  }
  resolveUrl(e) {
    return e.startsWith("http://") || e.startsWith("https://") ? e : typeof window < "u" ? `${window.location.origin}${e}` : e;
  }
}
export {
  m as UsersauClient
};
//# sourceMappingURL=index.js.map
