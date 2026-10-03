/**
 * Chat proxy logic, kept free of Express so it can be unit-tested:
 * request validation, per-body system prompts, rate limiting and model config.
 */
import { getBody, moonsOf, parentOf, TYPE_LABEL, type Body } from "../src/data/bodies.ts";

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export const LIMITS = {
  /** express.json body limit. */
  requestBytes: "24kb",
  /** Longest single user message, in characters. */
  messageChars: 1000,
  /** Max messages (user + assistant) sent in one conversation, including the new question. */
  conversationMessages: 21,
  /** Requests per IP per window. */
  rateLimitRequests: 12,
  rateLimitWindowMs: 60_000,
  /** Answer length cap. The prompt also asks for a few short paragraphs. */
  maxTokens: 4096,
};

// ---------------------------------------------------------------------------
// Model config (env-driven)
// ---------------------------------------------------------------------------

export const DEFAULT_MODEL = "claude-sonnet-5-5";

/** Models that accept the server-side `fallbacks: "default"` refusal fallback on the Claude API. */
const FALLBACK_MODELS = new Set([
  "claude-sonnet-5-5",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-fable-5-1",
]);

export interface ModelConfig {
  model: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  fallbacks: boolean;
}

export function modelConfigFromEnv(env: NodeJS.ProcessEnv): ModelConfig {
  const model = env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  // Chat answers are short and conversational, so low effort is the sweet spot.
  // Set ANTHROPIC_EFFORT to override, or to "none" to omit it (e.g. for Haiku 4.5).
  const rawEffort = env.ANTHROPIC_EFFORT?.trim().toLowerCase();
  let effort: ModelConfig["effort"];
  if (rawEffort === undefined || rawEffort === "") {
    effort = model.includes("haiku") ? undefined : "low";
  } else if (["low", "medium", "high", "xhigh", "max"].includes(rawEffort)) {
    effort = rawEffort as ModelConfig["effort"];
  }
  const fallbacks = env.ANTHROPIC_FALLBACKS?.trim().toLowerCase() !== "off" && FALLBACK_MODELS.has(model);
  return { model, effort, fallbacks };
}

export function hasCredentials(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env.ANTHROPIC_API_KEY?.trim() || env.ANTHROPIC_AUTH_TOKEN?.trim());
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ValidationResult =
  | { ok: true; body: Body; messages: ChatMessage[] }
  | { ok: false; status: number; code: string; message: string };

const fail = (status: number, code: string, message: string): ValidationResult => ({
  ok: false,
  status,
  code,
  message,
});

export function validateChatRequest(payload: unknown): ValidationResult {
  if (typeof payload !== "object" || payload === null) {
    return fail(400, "bad_request", "The request was not understood.");
  }
  const { bodyId, messages } = payload as { bodyId?: unknown; messages?: unknown };
  if (typeof bodyId !== "string") return fail(400, "bad_request", "No body was selected.");
  const body = getBody(bodyId);
  if (!body) return fail(400, "unknown_body", "That body isn't in this model of the Solar System.");
  if (!Array.isArray(messages) || messages.length === 0) {
    return fail(400, "bad_request", "There was no question to answer.");
  }
  if (messages.length > LIMITS.conversationMessages) {
    return fail(
      429,
      "conversation_limit",
      `This conversation has reached its limit. Clear it to start a fresh one about ${body.name}.`,
    );
  }
  const clean: ChatMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i] as { role?: unknown; content?: unknown };
    const expectedRole = i % 2 === 0 ? "user" : "assistant";
    if (m?.role !== expectedRole || typeof m.content !== "string") {
      return fail(400, "bad_request", "The conversation history was malformed.");
    }
    const content = m.content.trim();
    if (!content) return fail(400, "bad_request", "Messages can't be empty.");
    // Assistant turns are echoed back from our own answers; allow them to be longer.
    const cap = expectedRole === "user" ? LIMITS.messageChars : LIMITS.messageChars * 12;
    if (content.length > cap) {
      return fail(413, "too_long", `Please keep questions under ${LIMITS.messageChars} characters.`);
    }
    clean.push({ role: expectedRole, content });
  }
  if (clean[clean.length - 1].role !== "user") {
    return fail(400, "bad_request", "The last message must be a question.");
  }
  return { ok: true, body, messages: clean };
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(body: Body): string {
  const parent = parentOf(body);
  const moons = moonsOf(body.id);
  const lines = [
    `You are a friendly, accurate space guide inside an interactive 3D model of the Solar System. The visitor has selected ${body.name} and is asking about it.`,
    "",
    "How to answer:",
    `- Answer questions about ${body.name}, and about the wider Solar System or space science where that helps. If a question is unrelated to space, answer briefly if harmless and steer gently back to ${body.name}.`,
    "- Write for a curious general audience, including older children: plain language, vivid comparisons, no jargon without a quick explanation.",
    "- Keep it short: a few short paragraphs at most, often just one or two. Use plain text; avoid headings, tables and heavy markdown.",
    "- Be accurate. When something is uncertain, debated or unknown to science, say so honestly rather than guessing. If you're unsure of a number, give a rounded or approximate figure and say it's approximate.",
    "- The 3D model is deliberately not to scale (sizes and distances are compressed so everything fits on screen). If asked about what they see, explain that.",
    "",
    `About ${body.name}:`,
    `- Type: ${TYPE_LABEL[body.type]}${parent ? ` orbiting ${parent.name}` : body.type === "star" ? "" : " orbiting the Sun"}`,
    ...body.keyStats.map((s) => `- ${s.label}: ${s.value}`),
  ];
  if (moons.length) lines.push(`- Moons shown in this model: ${moons.map((m) => m.name).join(", ")}`);
  lines.push("", "Background:", body.blurb, "", "Facts the visitor can already see on screen:");
  lines.push(...body.facts.map((f) => `- ${f}`));
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Rate limiting (fixed window, in memory; fine for a single small server)
// ---------------------------------------------------------------------------

export class RateLimiter {
  private hits = new Map<string, { count: number; windowStart: number }>();

  constructor(
    private readonly limit = LIMITS.rateLimitRequests,
    private readonly windowMs = LIMITS.rateLimitWindowMs,
  ) {}

  /** Returns seconds to wait if limited, or 0 if the request may proceed. */
  check(key: string, now = Date.now()): number {
    const entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.hits.set(key, { count: 1, windowStart: now });
      this.prune(now);
      return 0;
    }
    if (entry.count >= this.limit) {
      return Math.ceil((entry.windowStart + this.windowMs - now) / 1000);
    }
    entry.count++;
    return 0;
  }

  private prune(now: number) {
    if (this.hits.size < 5000) return;
    for (const [k, v] of this.hits) if (now - v.windowStart >= this.windowMs) this.hits.delete(k);
  }
}
