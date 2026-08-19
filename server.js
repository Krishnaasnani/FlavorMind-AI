const express = require("express");
const dotenv = require("dotenv");
const { createClaudeMessageHandler } = require("./server/claudeHandler");
const { createAuthHandlers } = require("./server/authHandler");

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.API_PORT) || 3001;

app.use(express.json({ limit: "32kb" }));

const auth = createAuthHandlers();

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/auth/signup", auth.signup);
app.post("/api/auth/login", auth.login);
app.get("/api/auth/me", auth.me);
app.post("/api/auth/logout", auth.logout);

app.post("/api/claude/messages", createClaudeMessageHandler());

app.listen(port, "127.0.0.1", () => {
  console.log(`RecipeFinder AI API server listening at http://127.0.0.1:${port}`);
});
