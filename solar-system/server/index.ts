/**
 * Small server: serves the app (Vite middleware in dev, dist/ in production)
 * and proxies chat to the Anthropic API so the key never reaches the browser.
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  LIMITS,
  RateLimiter,
  buildSystemPrompt,
  hasCredentials,
  modelConfigFromEnv,
  validateChatRequest,
} from "./chat.ts";

try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment.
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5173;
const config = modelConfigFromEnv(process.env);
const chatEnabled = hasCredentials(process.env);
const client = chatEnabled ? new Anthropic() : null;
const limiter = new RateLimiter();

const app = express();
app.disable("x-powered-by");
// Behind a proxy (Render, Fly, etc.) set TRUST_PROXY=1 so rate limiting sees real client IPs.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || true);

app.get("/api/health", (_req, res) => {
  res.json({ chat: chatEnabled, model: chatEnabled ? config.model : null });
});

app.post("/api/chat", express.json({ limit: LIMITS.requestBytes }), async (req: Request, res: Response) => {
  if (!client) {
    res.status(503).json({
      code: "chat_unavailable",
      message: "Chat isn't set up on this server (no Anthropic API key). Everything else still works.",
    });
    return;
  }
  const wait = limiter.check(req.ip ?? "unknown");
  if (wait > 0) {
    res.setHeader("Retry-After", String(wait));
    res.status(429).json({
      code: "rate_limited",
      message: `You're asking questions faster than the guide can keep up. Try again in ${wait} seconds.`,
    });
    return;
  }
  const v = validateChatRequest(req.body);
  if (!v.ok) {
    res.status(v.status).json({ code: v.code, message: v.message });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const stream = client.beta.messages.stream({
    model: config.model,
    max_tokens: LIMITS.maxTokens,
    system: buildSystemPrompt(v.body),
    messages: v.messages,
    ...(config.effort ? { output_config: { effort: config.effort } } : {}),
    // Refusals are unlikely for space questions, but if a safety classifier
    // does decline, let the API retry on its recommended fallback model.
    ...(config.fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });

  let clientGone = false;
  res.on("close", () => {
    if (!res.writableFinished) {
      clientGone = true;
      stream.abort();
    }
  });

  try {
    stream.on("text", (text) => send({ type: "text", text }));
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      send({ type: "notice", text: "The guide can't help with that one. Try asking something else about this world." });
    } else if (final.stop_reason === "max_tokens") {
      send({ type: "notice", text: "(The answer was cut short.)" });
    }
    send({ type: "done" });
  } catch (err) {
    if (!clientGone) {
      console.error("[chat]", err instanceof Error ? err.message : err);
      send({ type: "error", message: friendlyError(err) });
    }
  } finally {
    res.end();
  }
});

function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) {
    return "The guide is very busy right now. Please wait a moment and try again.";
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return "The server's API key was rejected, so chat is unavailable. (The server owner needs to check it.)";
  }
  if (err instanceof Anthropic.NotFoundError || err instanceof Anthropic.BadRequestError) {
    return "The server's chat settings look wrong (check ANTHROPIC_MODEL). Chat is unavailable for now.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "The server couldn't reach the guide. Check the connection and try again.";
  }
  if (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500) {
    return "The guide is having trouble right now. Please try again in a little while.";
  }
  return "Something went wrong while answering. Please try again.";
}

app.use("/api", (_req, res) => {
  res.status(404).json({ code: "not_found", message: "Not found." });
});

const httpServer = http.createServer(app);

if (isProd) {
  const dist = path.join(root, "dist");
  app.use(express.static(dist, { index: "index.html", maxAge: "1h" }));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: { server: httpServer } }, appType: "spa" });
  app.use(vite.middlewares);
}

httpServer.listen(port, () => {
  console.log(`Solar System Explorer on http://localhost:${port}`);
  console.log(
    chatEnabled
      ? `Chat enabled (model: ${config.model}${config.effort ? `, effort: ${config.effort}` : ""})`
      : "Chat disabled: set ANTHROPIC_API_KEY in .env to enable it. Everything else works.",
  );
});
