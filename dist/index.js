var _ = Object.defineProperty;
var S = (o, e, t) => e in o ? _(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var l = (o, e, t) => S(o, typeof e != "symbol" ? e + "" : e, t);
const w = "urn:usersau:preferences", U = ["openid", "profile", "email", "preferences:read", "preferences:write"];
class a extends Error {
  constructor(e, t) {
    super(e === 409 ? "preferences_conflict" : [401, 403].includes(e) ? "preferences_reauthorization_required" : "preferences_unavailable"), this.status = e, this.preferences = t, this.name = "PreferencesError";
  }
}
function y(o, e) {
  if (!o || typeof o != "object") throw new a(502);
  const t = o;
  if (t.sub !== e || !Number.isSafeInteger(t.version) || t.version < 0 || !["system", "light", "dark"].includes(t.theme)) throw new a(502);
  if (t.locale != null && (typeof t.locale != "string" || t.locale.length > 35 || !/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(t.locale))) throw new a(502);
  if (t.timezone != null) {
    if (typeof t.timezone != "string") throw new a(502);
    try {
      new Intl.DateTimeFormat("en", { timeZone: t.timezone });
    } catch {
      throw new a(502);
    }
  }
  return {
    sub: e,
    locale: t.locale,
    timezone: t.timezone,
    theme: t.theme,
    version: t.version
  };
}
function b(o) {
  if (!o || typeof o != "object") throw new a(502);
  const e = o, t = e.sub ?? (typeof e.id == "number" ? String(e.id) : e.id);
  if (typeof t != "string" || t.length > 255 || !t || t.trim() !== t || /[\s\x00-\x1f\x7f]/.test(t) || e.sub != null && e.id != null && String(e.id) !== t) throw new a(502);
  const r = { id: t, sub: t }, s = r;
  for (const n of ["name", "given_name", "family_name", "middle_name", "nickname", "preferred_username", "gender", "birthdate", "zoneinfo", "locale", "email", "phone_number"])
    typeof e[n] == "string" && e[n] !== "" && (s[n] = e[n]);
  for (const n of ["profile", "picture", "website"]) {
    const i = n === "picture" ? e.picture ?? e.avatar ?? e.image : e[n];
    if (typeof i == "string")
      try {
        ["http:", "https:"].includes(new URL(i).protocol) && (s[n] = i);
      } catch {
      }
  }
  r.picture && (r.avatar = r.picture);
  for (const n of ["email_verified", "phone_number_verified"]) typeof e[n] == "boolean" && (s[n] = e[n]);
  if (Number.isSafeInteger(e.updated_at) && (r.updated_at = e.updated_at), e.address && typeof e.address == "object") {
    const n = e.address;
    r.address = Object.fromEntries(["formatted", "street_address", "locality", "region", "postal_code", "country"].filter((i) => typeof n[i] == "string").map((i) => [i, n[i]]));
  }
  return e[w] != null && (r[w] = y(e[w], t)), r;
}
async function d(o) {
  try {
    return await o.json();
  } catch {
    throw new a(502);
  }
}
function T() {
  const o = new Uint8Array(32);
  return crypto.getRandomValues(o), m(o);
}
async function P(o) {
  const t = new TextEncoder().encode(o), r = await crypto.subtle.digest("SHA-256", t);
  return m(new Uint8Array(r));
}
function E() {
  const o = new Uint8Array(16);
  return crypto.getRandomValues(o), m(o);
}
function m(o) {
  return btoa(String.fromCharCode(...o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
const c = {
  tokens: "usersau_tokens",
  user: "usersau_user",
  pkceVerifier: "usersau_pkce_verifier",
  oauthState: "usersau_oauth_state",
  flow: "usersau_flow"
};
class A {
  constructor(e = "localStorage", t = "") {
    l(this, "store");
    if (this.namespace = t, e === "memory")
      this.store = {};
    else
      try {
        typeof window > "u" ? this.store = {} : this.store = e === "sessionStorage" ? window.sessionStorage : window.localStorage;
      } catch {
        this.store = {};
      }
  }
  key(e) {
    return this.namespace ? `${this.namespace}:${e}` : e;
  }
  // ── Tokens ──────────────────────────────────────────────────────────────────
  setTokens(e) {
    this.store[this.key(c.tokens)] = JSON.stringify(e);
  }
  getTokens() {
    const e = this.store[this.key(c.tokens)];
    if (!e) return null;
    try {
      return JSON.parse(e);
    } catch {
      return null;
    }
  }
  clearTokens() {
    delete this.store[this.key(c.tokens)];
  }
  // ── User ────────────────────────────────────────────────────────────────────
  setUser(e) {
    this.store[this.key(c.user)] = JSON.stringify(e);
  }
  getUser() {
    const e = this.store[this.key(c.user)];
    if (!e) return null;
    try {
      return JSON.parse(e);
    } catch {
      return null;
    }
  }
  clearUser() {
    delete this.store[this.key(c.user)];
  }
  // ── PKCE / OAuth helpers ─────────────────────────────────────────────────────
  setPkceVerifier(e) {
    this.store[this.key(c.pkceVerifier)] = e;
  }
  getPkceVerifier() {
    return this.store[this.key(c.pkceVerifier)] ?? null;
  }
  clearPkceVerifier() {
    delete this.store[this.key(c.pkceVerifier)];
  }
  setOauthState(e) {
    this.store[this.key(c.oauthState)] = e;
  }
  getOauthState() {
    return this.store[this.key(c.oauthState)] ?? null;
  }
  clearOauthState() {
    delete this.store[this.key(c.oauthState)];
  }
  setFlow(e) {
    this.store[this.key(c.flow)] = e;
  }
  getFlow() {
    return this.store[this.key(c.flow)] ?? "login";
  }
  clearFlow() {
    delete this.store[this.key(c.flow)];
  }
  // ── Clear all ────────────────────────────────────────────────────────────────
  clearAll() {
    this.clearTokens(), this.clearUser(), this.clearPkceVerifier(), this.clearOauthState(), this.clearFlow();
  }
}
class $ {
  constructor(e) {
    l(this, "config");
    l(this, "storage");
    l(this, "_state");
    l(this, "generation", 0);
    l(this, "preferenceWrites", Promise.resolve());
    l(this, "refreshing");
    l(this, "listeners", []);
    const t = new URL(e.host);
    if (t.pathname !== "/" || t.username || t.password || t.search || t.hash || !["https:", "http:"].includes(t.protocol) || t.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(t.hostname)) throw new Error("Invalid Users.au host.");
    this.config = {
      clientId: e.clientId,
      host: t.origin,
      redirectUri: e.redirectUri,
      afterLoginUrl: e.afterLoginUrl ?? "/",
      afterLogoutUrl: e.afterLogoutUrl ?? "/",
      afterRegisterUrl: e.afterRegisterUrl ?? "/",
      scopes: e.scopes ?? [...U],
      storage: e.storage ?? "localStorage"
    }, this.storage = new A(this.config.storage, `usersau:${encodeURIComponent(this.config.host)}:${encodeURIComponent(this.config.clientId)}`);
    const r = this.storage.getTokens(), s = this.storage.getUser();
    this._state = {
      user: s,
      tokens: r,
      isAuthenticated: !!r && !!s,
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
  get preferences() {
    var e;
    return ((e = this.user) == null ? void 0 : e[w]) ?? null;
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
    const e = T(), t = await P(e), r = E();
    this.storage.setPkceVerifier(e), this.storage.setOauthState(r), this.storage.setFlow("login");
    const s = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scopes.join(" "),
      state: r,
      code_challenge: t,
      code_challenge_method: "S256"
    });
    window.location.href = `${this.config.host}/oauth/authorize?${s}`;
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
    const t = ++this.generation;
    this.refreshing = void 0, this.setState({ isLoading: !0, error: null });
    try {
      const r = e ? new URLSearchParams(e) : new URLSearchParams(window.location.search), s = r.get("code"), n = r.get("state"), i = r.get("error");
      if (i)
        throw new Error(`OAuth error: ${i} — ${r.get("error_description") ?? ""}`);
      if (!s)
        throw new Error("No authorization code found in callback URL.");
      const u = this.storage.getOauthState();
      if (!u || n !== u)
        throw new Error("OAuth state mismatch. Possible CSRF attack.");
      const g = this.storage.getPkceVerifier();
      if (!g)
        throw new Error("No PKCE verifier found. Did login() run in the same browser?");
      this.storage.clearPkceVerifier(), this.storage.clearOauthState();
      const f = await this.exchangeCodeForTokens(s, g), h = await this.fetchUserInfo(f.accessToken);
      if (t !== this.generation) throw new a(401);
      this.storage.setTokens(f), this.storage.setUser(h), this.storage.clearPkceVerifier(), this.storage.clearOauthState();
      const p = this.storage.getFlow();
      this.storage.clearFlow(), this.setState({ user: h, tokens: f, isAuthenticated: !0, isLoading: !1 });
      const k = p === "register" ? this.config.afterRegisterUrl : this.config.afterLoginUrl;
      return typeof window < "u" && !e && (window.location.href = k), h;
    } catch (r) {
      const s = r instanceof Error ? r : new Error(String(r));
      throw t === this.generation && this.setState({ isLoading: !1, error: s }), s;
    }
  }
  /**
   * Logs the user out locally and redirects to Users.au single sign-out.
   * Mirrors PHP: AuthController::logout()
   */
  logout() {
    this.generation++, this.refreshing = void 0, this.storage.clearAll(), this.setState({ user: null, tokens: null, isAuthenticated: !1, error: null });
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
    if (this.refreshing) return this.refreshing;
    const e = this.performRefresh();
    this.refreshing = e;
    try {
      return await e;
    } finally {
      this.refreshing === e && (this.refreshing = void 0);
    }
  }
  async performRefresh() {
    const e = this.generation, t = this.storage.getTokens();
    if (!(t != null && t.refreshToken))
      throw new Error("No refresh token available. User must log in again.");
    const r = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      refresh_token: t.refreshToken
    }), s = await fetch(`${this.config.host}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: r.toString()
    });
    if (e !== this.generation) throw new a(401);
    if (!s.ok)
      throw this.storage.clearAll(), this.setState({ user: null, tokens: null, isAuthenticated: !1 }), new Error(`Token refresh failed (${s.status}).`);
    const n = await d(s), i = this.parseTokenResponse(n);
    return i.refreshToken ?? (i.refreshToken = t.refreshToken), this.storage.setTokens(i), this.setState({ tokens: i }), i;
  }
  /**
   * Fetch the current user's info from Users.au.
   * Useful for refreshing profile data without re-authenticating.
   */
  async syncUser() {
    var n;
    const e = this.generation, t = (n = this.user) == null ? void 0 : n.sub, r = this.accessToken;
    if (!r) throw new Error("Not authenticated.");
    const s = await this.fetchUserInfo(r);
    if (e !== this.generation || s.sub !== t) throw new a(502);
    return this.storage.setUser(s), this.setState({ user: s }), s;
  }
  /** Fetch the current account's confirmed global preferences. */
  async getPreferences() {
    return this.preferenceRequest("GET");
  }
  /** Serialize writes and use the latest confirmed version unless explicitly supplied. */
  updatePreferences(e, t) {
    const r = this.generation, s = this.preferenceWrites.then(async () => {
      if (r !== this.generation) throw new a(401);
      const n = t ?? (this.preferences ?? await this.getPreferences()).version;
      return this.preferenceRequest("PATCH", e, n);
    });
    return this.preferenceWrites = s.catch(() => {
    }), s;
  }
  acceptPreferences(e, t) {
    var s;
    if (t !== this.generation || ((s = this.user) == null ? void 0 : s.sub) !== e.sub) throw new a(401);
    if (this.preferences && this.preferences.version > e.version) return this.preferences;
    const r = { ...this.user, [w]: e };
    return e.locale ? r.locale = e.locale : delete r.locale, e.timezone ? r.zoneinfo = e.timezone : delete r.zoneinfo, this.storage.setUser(r), this.setState({ user: r }), e;
  }
  async preferenceRequest(e, t, r) {
    var u, g;
    const s = this.generation, n = (u = this.user) == null ? void 0 : u.sub;
    if (!n || !this.accessToken || this._state.isLoading) throw new a(401);
    const i = Object.fromEntries(Object.entries(t ?? {}).filter(([f, h]) => ["locale", "timezone", "theme"].includes(f) && h !== void 0));
    for (let f = 0; f < 2; f++) {
      if (s !== this.generation) throw new a(401);
      const h = await fetch(`${this.config.host}/api/interface-preferences`, {
        method: e,
        redirect: "error",
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(5e3),
        headers: { Accept: "application/json", Authorization: `Bearer ${this.accessToken}`, ...e === "PATCH" ? { "Content-Type": "application/json" } : {} },
        ...e === "PATCH" ? { body: JSON.stringify({ ...i, expected_version: r }) } : {}
      });
      if (s !== this.generation) throw new a(401);
      if (h.status === 401 && f === 0 && ((g = this._state.tokens) != null && g.refreshToken)) {
        await this.refreshToken();
        continue;
      }
      if (h.status === 409) {
        const p = await d(h), k = this.acceptPreferences(y(p.preferences, n), s);
        throw new a(409, k);
      }
      if (!h.ok) throw new a([401, 403, 422].includes(h.status) ? h.status : 503);
      return this.acceptPreferences(y(await d(h), n), s);
    }
    throw new a(401);
  }
  // ── Private helpers ──────────────────────────────────────────────────────────
  async exchangeCodeForTokens(e, t) {
    const r = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      code: e,
      redirect_uri: this.config.redirectUri,
      code_verifier: t
    }), s = await fetch(`${this.config.host}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: r.toString()
    });
    if (!s.ok)
      throw new Error(`Token exchange failed (${s.status}).`);
    const n = await d(s);
    return this.parseTokenResponse(n);
  }
  async fetchUserInfo(e) {
    const t = await fetch(`${this.config.host}/api/user`, {
      headers: { Authorization: `Bearer ${e}` },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(5e3)
    });
    if (!t.ok)
      throw new Error(`Failed to fetch user info (${t.status}).`);
    return b(await d(t));
  }
  parseTokenResponse(e) {
    if (typeof e.access_token != "string" || !e.access_token) throw new a(502);
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
  U as IDENTITY_SCOPES,
  w as PREFERENCES_CLAIM,
  a as PreferencesError,
  $ as UsersauClient,
  y as normalizePreferences,
  b as normalizeUserInfo,
  d as readIdentityJson
};
//# sourceMappingURL=index.js.map
