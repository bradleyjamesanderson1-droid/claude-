import { describe, expect, it } from "vitest";
import {
  LIMITS,
  RateLimiter,
  buildSystemPrompt,
  hasCredentials,
  modelConfigFromEnv,
  validateChatRequest,
} from "../server/chat.ts";
import { getBody } from "../src/data/bodies.ts";
import { parseSSE } from "../src/chat/api.ts";
import { MAX_CONVERSATION_MESSAGES } from "../src/chat/store.ts";

describe("validateChatRequest", () => {
  const q = (content: string) => ({ role: "user", content });

  it("accepts a simple question", () => {
    const v = validateChatRequest({ bodyId: "io", messages: [q("Why so many volcanoes?")] });
    expect(v.ok).toBe(true);
  });

  it("rejects unknown bodies and malformed history", () => {
    expect(validateChatRequest({ bodyId: "vulcan", messages: [q("hi")] }).ok).toBe(false);
    expect(validateChatRequest({ bodyId: "io", messages: [] }).ok).toBe(false);
    expect(validateChatRequest({ bodyId: "io", messages: [q("a"), q("b")] }).ok).toBe(false);
    expect(validateChatRequest({ bodyId: "io", messages: [{ role: "system", content: "x" }] }).ok).toBe(false);
    expect(validateChatRequest(null).ok).toBe(false);
  });

  it("caps question length and conversation length", () => {
    const long = validateChatRequest({ bodyId: "io", messages: [q("x".repeat(LIMITS.messageChars + 1))] });
    expect(long.ok === false && long.status).toBe(413);
    const msgs = Array.from({ length: LIMITS.conversationMessages + 2 }, (_, i) =>
      i % 2 ? { role: "assistant", content: "a" } : q("b"),
    ).slice(0, LIMITS.conversationMessages + 2);
    const tooMany = validateChatRequest({ bodyId: "io", messages: msgs });
    expect(tooMany.ok === false && tooMany.code).toBe("conversation_limit");
  });

  it("client and server agree on the conversation cap", () => {
    expect(MAX_CONVERSATION_MESSAGES).toBe(LIMITS.conversationMessages);
  });
});

describe("buildSystemPrompt", () => {
  it("grounds the guide in the selected body", () => {
    const europa = getBody("europa")!;
    const p = buildSystemPrompt(europa);
    expect(p).toContain("selected Europa");
    expect(p).toContain("Moon orbiting Jupiter");
    expect(p).toContain(europa.facts[0]);
    expect(p).toContain(europa.blurb);
    expect(p).toMatch(/uncertain/i);
  });

  it("lists moons for planets", () => {
    expect(buildSystemPrompt(getBody("mars")!)).toContain("Phobos, Deimos");
  });
});

describe("config", () => {
  it("defaults to a current Sonnet with low effort and fallbacks", () => {
    expect(modelConfigFromEnv({})).toEqual({ model: "claude-sonnet-5-5", effort: "low", fallbacks: true });
  });

  it("follows ANTHROPIC_MODEL and drops unsupported extras", () => {
    const c = modelConfigFromEnv({ ANTHROPIC_MODEL: "claude-haiku-4-5" });
    expect(c).toEqual({ model: "claude-haiku-4-5", effort: undefined, fallbacks: false });
    expect(modelConfigFromEnv({ ANTHROPIC_EFFORT: "none" }).effort).toBeUndefined();
    expect(modelConfigFromEnv({ ANTHROPIC_FALLBACKS: "off" }).fallbacks).toBe(false);
  });

  it("detects missing credentials", () => {
    expect(hasCredentials({})).toBe(false);
    expect(hasCredentials({ ANTHROPIC_API_KEY: "  " })).toBe(false);
    expect(hasCredentials({ ANTHROPIC_API_KEY: "sk-test" })).toBe(true);
  });
});

describe("RateLimiter", () => {
  it("limits per key within a window", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.check("a", 0)).toBe(0);
    expect(rl.check("a", 10)).toBe(0);
    expect(rl.check("a", 20)).toBeGreaterThan(0);
    expect(rl.check("b", 20)).toBe(0);
    expect(rl.check("a", 1001)).toBe(0);
  });
});

describe("parseSSE", () => {
  it("handles events split across reads", () => {
    const a = parseSSE('data: {"type":"text","text":"Hel');
    expect(a.events).toEqual([]);
    const b = parseSSE(a.rest + 'lo"}\n\ndata: {"type":"done"}\n\n');
    expect(b.events).toEqual([{ type: "text", text: "Hello" }, { type: "done" }]);
    expect(b.rest).toBe("");
  });

  it("ignores junk frames", () => {
    expect(parseSSE(": ping\n\ndata: nope\n\n").events).toEqual([]);
  });
});
