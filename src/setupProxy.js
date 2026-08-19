const express = require("express");
const { createClaudeMessageHandler } = require("../server/claudeHandler");
const { createAuthHandlers } = require("../server/authHandler");

module.exports = (app) => {
  const auth = createAuthHandlers();
  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/api/auth/signup", express.json({ limit: "8kb" }), auth.signup);
  app.post("/api/auth/login", express.json({ limit: "8kb" }), auth.login);
  app.get("/api/auth/me", auth.me);
  app.post("/api/auth/logout", auth.logout);

  app.post(
    "/api/claude/messages",
    express.json({ limit: "32kb" }),
    createClaudeMessageHandler()
  );
};
