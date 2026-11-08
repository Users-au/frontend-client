async function c(e, t, n, u, d) {
  if (typeof window < "u") throw new Error("Confidential Users.au requests require a server.");
  let r;
  try {
    r = new URL(e.host);
  } catch {
    throw new Error("A valid HTTPS Users.au origin is required.");
  }
  if (r.protocol !== "https:" || r.username || r.password || r.search || r.hash || r.pathname !== "/" || !e.clientId || !e.clientSecret) throw new Error("A valid HTTPS Users.au origin and client credentials are required.");
  const h = Array.from(new TextEncoder().encode(`${e.clientId}:${e.clientSecret}`), (l) => String.fromCharCode(l)).join("");
  let a;
  try {
    a = await fetch(new URL(t, r), {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(15e3),
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", Authorization: `Basic ${btoa(h)}` },
      body: new URLSearchParams({ ...u, client_id: e.clientId, context: JSON.stringify(d) })
    });
  } catch {
    throw new Error("Users.au is temporarily unavailable.");
  }
  let o;
  try {
    o = await a.json();
  } catch {
    throw new Error("Users.au rejected the pushed request.");
  }
  const i = o && typeof o == "object" && "request_uri" in o ? o.request_uri : null;
  if (a.status !== 201 || typeof i != "string" || !/^urn:ietf:params:oauth:request_uri:[A-Za-z0-9_-]{43,128}$/.test(i))
    throw new Error("Users.au rejected the pushed request.");
  const s = new URL(n, r);
  return s.search = new URLSearchParams({ client_id: e.clientId, request_uri: i }).toString(), s.toString();
}
function p(e, t, n) {
  return c(e, "/oauth/par", "/oauth/authorize", {
    ...t,
    scope: t.scope ?? "openid profile email",
    response_type: "code",
    code_challenge_method: "S256"
  }, n);
}
function w(e, t, n) {
  return c(e, "/oauth/context", `/${t}`, { purpose: t }, n);
}
export {
  w as createApplicationContextUrl,
  p as createPushedAuthorizationUrl
};
//# sourceMappingURL=server.js.map
