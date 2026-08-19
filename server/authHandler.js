const crypto = require("crypto");

const sessionCookieName = "rf_session";
const sessionMaxAge = 60 * 60 * 24 * 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordMinLength = 8;
const passwordMaxLength = 128;
const authRateWindowMs = 15 * 60 * 1000;
const authRateMax = 10;

function publicUser(user) {
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, pair) => {
    const separator = pair.indexOf("=");
    if (separator < 0) return cookies;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (key) {
      try { cookies[key] = decodeURIComponent(value); }
      catch (_error) { cookies[key] = value; }
    }
    return cookies;
  }, {});
}

function setSessionCookie(response, token, remember) {
  const parts = [`${sessionCookieName}=${encodeURIComponent(token)}`, "HttpOnly", "Path=/", "SameSite=Lax"];
  if (remember) parts.push(`Max-Age=${sessionMaxAge}`);
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  response.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function getSessionUser(request, users, sessions) {
  const token = parseCookies(request.headers?.cookie)[sessionCookieName];
  const userId = token && sessions.get(token);
  return userId ? users.get(userId) : null;
}

function error(response, status, code, message) {
  return response.status(status).json({ error: { code, message } });
}

function validateCredentials(body, { includeName = false } = {}) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (includeName && (name.length < 2 || name.length > 80)) return { error: "Please enter a name between 2 and 80 characters." };
  if (!emailPattern.test(email) || email.length > 160) return { error: "Please enter a valid email address." };
  if (password.length < passwordMinLength || password.length > passwordMaxLength) return { error: `Password must be ${passwordMinLength}-${passwordMaxLength} characters.` };
  return { name, email, password };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") };
}

function passwordMatches(password, user) {
  const candidate = crypto.scryptSync(password, user.salt, 64);
  const stored = Buffer.from(user.passwordHash, "hex");
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
}

function createAuthHandlers(options = {}) {
  const users = options.users || new Map();
  const sessions = options.sessions || new Map();
  const attempts = options.attempts || new Map();

  function rateLimited(request) {
    const ip = request.ip || request.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const current = attempts.get(ip);
    if (!current || now - current.startedAt >= authRateWindowMs) {
      attempts.set(ip, { startedAt: now, count: 1 });
      return false;
    }
    current.count += 1;
    return current.count > authRateMax;
  }

  function createSession(response, user, remember) {
    const token = crypto.randomBytes(32).toString("base64url");
    sessions.set(token, user.email);
    setSessionCookie(response, token, remember);
  }

  async function signup(request, response) {
    const credentials = validateCredentials(request.body, { includeName: true });
    if (credentials.error) return error(response, 400, "INVALID_SIGNUP", credentials.error);
    if (users.has(credentials.email)) return error(response, 409, "ACCOUNT_EXISTS", "An account with that email already exists.");
    const { salt, hash } = hashPassword(credentials.password);
    const user = { id: crypto.randomUUID(), name: credentials.name, email: credentials.email, salt, passwordHash: hash };
    users.set(user.email, user);
    createSession(response, user, Boolean(request.body?.remember));
    return response.status(201).json({ user: publicUser(user) });
  }

  async function login(request, response) {
    const credentials = validateCredentials(request.body);
    if (credentials.error) return error(response, 400, "INVALID_LOGIN", credentials.error);
    if (rateLimited(request)) return error(response, 429, "AUTH_RATE_LIMITED", "Too many sign-in attempts. Please try again later.");
    const user = users.get(credentials.email);
    if (!user || !passwordMatches(credentials.password, user)) return error(response, 401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    createSession(response, user, Boolean(request.body?.remember));
    return response.status(200).json({ user: publicUser(user) });
  }

  function me(request, response) {
    return response.status(200).json({ user: publicUser(getSessionUser(request, users, sessions)) });
  }

  function logout(request, response) {
    const token = parseCookies(request.headers?.cookie)[sessionCookieName];
    if (token) sessions.delete(token);
    clearSessionCookie(response);
    return response.status(200).json({ ok: true });
  }

  return { signup, login, me, logout, users, sessions };
}

module.exports = { createAuthHandlers, validateCredentials, passwordMinLength };
