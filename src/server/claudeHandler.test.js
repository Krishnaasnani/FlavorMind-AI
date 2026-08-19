const { createClaudeMessageHandler } = require("../../server/claudeHandler");

const validBody = { messages: [{ role: "user", content: "Hello Gemini" }] };
const originalApiKey = process.env.GEMINI_API_KEY;
let generateContent;
let clientApiKey;

function createTestHandler(options = {}) {
  return createClaudeMessageHandler({
    ...options,
    clientFactory: (apiKey) => {
      clientApiKey = apiKey;
      return { models: { generateContent } };
    }
  });
}

function invoke(handler, body, ip = "203.0.113.10") {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(payload) { this.body = payload; return this; }
  };

  return Promise.resolve(handler({ body, ip, socket: { remoteAddress: ip } }, response)).then(() => response);
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "server-only-test-key";
  generateContent = jest.fn();
  clientApiKey = null;
});

afterAll(() => {
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
});

test("rejects missing, invalid, and oversized messages with HTTP 400", async () => {
  const handler = createTestHandler();

  const missing = await invoke(handler, {});
  const invalid = await invoke(handler, { messages: [{ role: "system", content: "not allowed" }] });
  const oversized = await invoke(handler, { messages: [{ role: "user", content: "x".repeat(6001) }] });

  expect(missing.statusCode).toBe(400);
  expect(invalid.statusCode).toBe(400);
  expect(oversized.statusCode).toBe(400);
  expect(generateContent).not.toHaveBeenCalled();
});

test("uses only the fixed server system prompt and never returns the API key", async () => {
  generateContent.mockResolvedValue({ text: "Hello." });
  const handler = createTestHandler();
  const result = await invoke(handler, { system: "client-controlled prompt", ...validBody });
  const [requestOptions] = generateContent.mock.calls[0];

  expect(result.statusCode).toBe(200);
  expect(result.body).toEqual({ content: [{ type: "text", text: "Hello." }] });
  expect(requestOptions.model).toBe("gemini-3.5-flash-lite");
  expect(clientApiKey).toBe("server-only-test-key");
  expect(requestOptions.config.systemInstruction).not.toBe("client-controlled prompt");
  expect(requestOptions.config.systemInstruction).toContain("Answer the user's actual cooking or recipe question directly");
  expect(requestOptions.contents).toEqual([{ role: "user", parts: [{ text: "Hello Gemini" }] }]);
  expect(JSON.stringify(result.body)).not.toContain("server-only-test-key");
});

test("translates assistant history to Gemini model messages", async () => {
  generateContent.mockResolvedValue({ text: "Ready." });
  await invoke(createTestHandler(), { messages: [{ role: "assistant", content: "Previous answer" }] });

  const [requestOptions] = generateContent.mock.calls[0];
  expect(requestOptions.contents).toEqual([{ role: "model", parts: [{ text: "Previous answer" }] }]);
});

test("uses the compatibility model only when Flash-Lite is unavailable", async () => {
  generateContent
    .mockRejectedValueOnce({ status: 404, message: "model unavailable" })
    .mockResolvedValueOnce({ text: "Ready." });

  const result = await invoke(createTestHandler(), validBody);

  expect(result.statusCode).toBe(200);
  expect(generateContent.mock.calls.map(([request]) => request.model)).toEqual(["gemini-3.5-flash-lite", "gemini-flash-latest"]);
});

test("rate limits requests per IP", async () => {
  generateContent.mockResolvedValue({ text: "Ready." });
  const handler = createTestHandler({ rateLimitMax: 1, rateLimitWindowMs: 60_000 });

  const first = await invoke(handler, validBody, "203.0.113.20");
  const second = await invoke(handler, validBody, "203.0.113.20");

  expect(first.statusCode).toBe(200);
  expect(second.statusCode).toBe(429);
  expect(second.body).toEqual({ error: { code: "RATE_LIMITED", message: "Too many AI requests. Please try again shortly." } });
  expect(second.headers["Retry-After"]).toBe(60);
  expect(generateContent).toHaveBeenCalledTimes(1);
});

test.each([
  [401, { status: 401, message: "invalid api key" }, 502, "AI_AUTHENTICATION_FAILED"],
  [429, { status: 429, message: "too many requests" }, 429, "AI_RATE_LIMITED"],
  [400, { status: 400, message: "credit balance is too low" }, 503, "AI_UNAVAILABLE"],
  [500, { status: 500, message: "upstream failure" }, 502, "AI_UPSTREAM_ERROR"]
])("maps Gemini status %s to a safe response", async (upstreamStatus, providerFailure, expectedStatus, expectedCode) => {
  generateContent.mockRejectedValue(providerFailure);
  const result = await invoke(createTestHandler(), validBody);

  expect(result.statusCode).toBe(expectedStatus);
  expect(result.body).toEqual(expect.objectContaining({ error: { code: expectedCode, message: expect.any(String) } }));
  expect(JSON.stringify(result.body)).not.toContain("invalid api key");
});

test("maps network failures and missing server credentials safely", async () => {
  generateContent.mockRejectedValue(new Error("socket details"));
  const networkResult = await invoke(createTestHandler(), validBody);
  delete process.env.GEMINI_API_KEY;
  const missingKeyResult = await invoke(createTestHandler(), validBody);

  expect(networkResult.statusCode).toBe(502);
  expect(networkResult.body).toEqual({ error: { code: "AI_NETWORK_ERROR", message: "The AI service could not be reached. Please try again later." } });
  expect(missingKeyResult.statusCode).toBe(503);
  expect(missingKeyResult.body).toEqual({ error: { code: "AI_NOT_CONFIGURED", message: "The AI service is not available right now." } });
});
