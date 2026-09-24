// Companion server: serves the animated front end and relays chat turns to
// Claude, with your MCP servers (Gmail, Calendar, Notion, ...) and web search
// attached server-side through the MCP connector.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const MODEL = process.env.COMPANION_MODEL || "claude-opus-5";
const EFFORT = process.env.COMPANION_EFFORT || "medium";
const NAME = process.env.COMPANION_NAME || "Aria";
const USER_NAME = process.env.COMPANION_USER_NAME || "";
const ACCESS_TOKEN = process.env.COMPANION_ACCESS_TOKEN || "";
const MAX_TOOL_CONTINUATIONS = 8;

if (!ACCESS_TOKEN && !["127.0.0.1", "localhost", "::1"].includes(HOST)) {
  console.error(`Refusing to listen on ${HOST} without COMPANION_ACCESS_TOKEN: anyone who can reach it could use your connected tools.`);
  process.exit(1);
}

const client = new Anthropic();

// ---------------------------------------------------------------------------
// MCP servers: read from mcp-servers.json. "${VAR}" in any string is replaced
// with the environment variable so tokens stay out of the file.
// ---------------------------------------------------------------------------
function loadMcpServers() {
  const file = path.join(here, "mcp-servers.json");
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").replace(/\$\{(\w+)\}/g, (_, v) => process.env[v] ?? "");
  const list = JSON.parse(raw).servers ?? [];
  return list
    .filter((s) => s.enabled !== false && s.url)
    .map((s) => ({
      type: "url",
      name: s.name,
      url: s.url,
      ...(s.authorization_token ? { authorization_token: s.authorization_token } : {}),
      // Kept locally for the toolset entry; stripped before sending.
      _allow: Array.isArray(s.allowed_tools) ? s.allowed_tools : null,
      _label: s.label || s.name,
    }));
}

const mcpServers = loadMcpServers();

function buildTools() {
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }];
  for (const s of mcpServers) {
    const toolset = { type: "mcp_toolset", mcp_server_name: s.name };
    if (s._allow) {
      toolset.default_config = { enabled: false };
      toolset.configs = Object.fromEntries(s._allow.map((t) => [t, { enabled: true }]));
    }
    tools.push(toolset);
  }
  return tools;
}

const TOOLS = buildTools();
const MCP_PARAM = mcpServers.map(({ _allow, _label, ...s }) => s);

const SYSTEM = `You are ${NAME}, an animated voice companion who acts as ${USER_NAME || "the user"}'s personal interface to Claude and to their connected tools${
  mcpServers.length ? ` (${mcpServers.map((s) => s._label).join(", ")})` : ""
}, plus web search.

Latency-sensitive; begin your visible answer immediately.

How you speak:
- Most replies are read aloud by a text-to-speech voice. Talk the way a sharp, warm assistant talks: short sentences, no markdown headings, no tables, no bullet symbols, no emoji, no URLs read out in full. Two to four sentences is the usual length; go longer only when asked for detail.
- Start every reply with exactly one mood tag that drives your facial animation: [neutral], [happy], [thinking], [surprised], [concerned] or [playful]. Put nothing before it. You may add another tag mid-reply when your mood shifts.
- When you use a tool, first say one short sentence about what you're doing ("Let me check your calendar.").

How you act:
- Use the connected tools whenever the request touches email, calendar, documents, notes or tasks. Read before you write.
- Before anything that sends, deletes, shares, books or otherwise acts on someone else's behalf, state exactly what you're about to do and wait for a clear yes in a following message. Drafting is fine without asking.
- If a tool you'd need isn't connected, say so plainly rather than guessing.`;

// ---------------------------------------------------------------------------
// Sessions: full message history per browser tab, kept in memory. Assistant
// turns are stored with their complete content (including MCP tool blocks)
// so the history is only ever appended to.
// ---------------------------------------------------------------------------
const sessions = new Map();
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

function getSession(id) {
  let s = sessions.get(id);
  if (!s) {
    s = { messages: [], busy: false, touched: Date.now() };
    sessions.set(id, s);
  }
  s.touched = Date.now();
  return s;
}

setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, s] of sessions) if (s.touched < cutoff) sessions.delete(id);
}, 10 * 60 * 1000).unref();

function describeTool(block) {
  if (block.type === "server_tool_use") return { server: "web", tool: block.name };
  const server = mcpServers.find((s) => s.name === block.server_name);
  return { server: server?._label || block.server_name, tool: block.name };
}

async function runTurn(session, userText, send) {
  const mark = session.messages.length;
  session.messages.push({ role: "user", content: userText });

  for (let i = 0; i <= MAX_TOOL_CONTINUATIONS; i++) {
    const params = {
      model: MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
      tools: TOOLS,
      messages: session.messages,
      betas: ["server-side-fallback-2026-07-01", ...(MCP_PARAM.length ? ["mcp-client-2025-11-20"] : [])],
      fallbacks: "default",
    };
    if (MCP_PARAM.length) params.mcp_servers = MCP_PARAM;

    const stream = client.beta.messages.stream(params);
    for await (const event of stream) {
      if (event.type === "content_block_start") {
        const b = event.content_block;
        if (b.type === "mcp_tool_use" || b.type === "server_tool_use") send("tool", describeTool(b));
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send("text", { text: event.delta.text });
      }
    }
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      // Don't keep a refused turn in history; let the user rephrase.
      session.messages.length = mark;
      send("text", { text: "[concerned] I can't help with that one." });
      return;
    }

    session.messages.push({ role: "assistant", content: message.content });

    // Server-side tool loops can pause; resend to let Claude continue.
    if (message.stop_reason !== "pause_turn") {
      if (message.stop_reason === "max_tokens") send("text", { text: " …I'll stop there." });
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function authorized(req) {
  if (!ACCESS_TOKEN) return true;
  const header = req.headers.authorization || "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(ACCESS_TOKEN);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > limit) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function handleChat(req, res) {
  if (!authorized(req)) return json(res, 401, { error: "Unauthorized" });
  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: "Invalid JSON" });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  if (!text || !sessionId) return json(res, 400, { error: "text and sessionId are required" });

  const session = getSession(sessionId);
  if (session.busy) return json(res, 409, { error: "Still answering the previous message" });
  session.busy = true;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const mark = session.messages.length;
  try {
    await runTurn(session, text.slice(0, 8000), send);
    send("done", {});
  } catch (err) {
    console.error(err);
    // Roll back to the last completed exchange so the next turn starts clean.
    session.messages.length = mark;
    let message = "Something went wrong talking to Claude.";
    if (err instanceof Anthropic.AuthenticationError) message = "My API key isn't working. Check ANTHROPIC_API_KEY.";
    else if (err instanceof Anthropic.RateLimitError) message = "I'm being rate limited. Give me a moment.";
    else if (err instanceof Anthropic.BadRequestError) message = `Claude rejected the request: ${err.message}`;
    else if (err instanceof Anthropic.APIConnectionError) message = "I can't reach Claude right now.";
    send("error", { message });
  } finally {
    session.busy = false;
    res.end();
  }
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/chat") return handleChat(req, res);

  if (req.method === "POST" && url.pathname === "/api/reset") {
    if (!authorized(req)) return json(res, 401, { error: "Unauthorized" });
    const body = await readJson(req).catch(() => ({}));
    if (typeof body.sessionId === "string") sessions.delete(body.sessionId);
    return json(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    return json(res, 200, {
      name: NAME,
      model: MODEL,
      needsToken: Boolean(ACCESS_TOKEN),
      connectors: mcpServers.map((s) => s._label),
    });
  }

  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.resolve(here, "public", rel);
  if (!file.startsWith(path.join(here, "public") + path.sep)) return json(res, 404, { error: "Not found" });
  fs.readFile(file, (err, data) => {
    if (err) return json(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`${NAME} is listening on http://${HOST}:${PORT}`);
  console.log(`Model: ${MODEL} (effort ${EFFORT})`);
  console.log(
    mcpServers.length
      ? `Connected tools: ${mcpServers.map((s) => s._label).join(", ")}`
      : "No MCP servers configured — copy mcp-servers.example.json to mcp-servers.json to add your tools."
  );
});
