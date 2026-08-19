const { createAuthHandlers } = require("../../server/authHandler");

function responseDouble() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; },
    json(body) { this.body = body; return this; }
  };
}

function request(body = {}, cookie = "") {
  return { body, headers: { cookie }, socket: { remoteAddress: "127.0.0.1" } };
}

test("stores hashed passwords and persists a session through me", async () => {
  const handlers = createAuthHandlers({ users: new Map(), sessions: new Map() });
  const signupResponse = responseDouble();
  await handlers.signup(request({ name: "Ada", email: "ada@example.com", password: "correct horse", remember: true }), signupResponse);
  expect(signupResponse.statusCode).toBe(201);
  expect(signupResponse.body.user.email).toBe("ada@example.com");
  const storedUser = handlers.users.get("ada@example.com");
  expect(storedUser.passwordHash).not.toBe("correct horse");
  const cookie = signupResponse.headers["Set-Cookie"].split(";")[0];
  const meResponse = responseDouble();
  handlers.me(request({}, cookie), meResponse);
  expect(meResponse.body.user).toEqual(signupResponse.body.user);
});

test("rejects invalid signup and bad login without revealing account details", async () => {
  const handlers = createAuthHandlers({ users: new Map(), sessions: new Map() });
  const invalidResponse = responseDouble();
  await handlers.signup(request({ name: "A", email: "bad", password: "short" }), invalidResponse);
  expect(invalidResponse.statusCode).toBe(400);
  const loginResponse = responseDouble();
  await handlers.login(request({ email: "nobody@example.com", password: "wrong password" }), loginResponse);
  expect(loginResponse.statusCode).toBe(401);
  expect(loginResponse.body.error.message).toBe("Email or password is incorrect.");
});

test("logout clears the session cookie", async () => {
  const handlers = createAuthHandlers({ users: new Map(), sessions: new Map() });
  const signupResponse = responseDouble();
  await handlers.signup(request({ name: "Ada", email: "ada@example.com", password: "correct horse" }), signupResponse);
  const logoutResponse = responseDouble();
  handlers.logout(request({}, signupResponse.headers["Set-Cookie"]), logoutResponse);
  expect(logoutResponse.headers["Set-Cookie"]).toContain("Max-Age=0");
});
