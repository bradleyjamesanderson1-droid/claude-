/**
 * Browser side of the chat proxy: health check and a streaming POST parsed as
 * server-sent events.
 */

export interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "notice"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export class ChatError extends Error {}

export interface Health {
  chat: boolean;
  reason?: string;
}

export async function fetchHealth(): Promise<Health> {
  try {
    const res = await fetch("/api/health", { headers: { Accept: "application/json" } });
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) throw new Error();
    const json = (await res.json()) as { chat?: boolean };
    return json.chat
      ? { chat: true }
      : { chat: false, reason: "Chat isn't set up on this server (no API key), but everything else works." };
  } catch {
    return {
      chat: false,
      reason: "Chat needs the app's small server (npm run dev), which isn't running here. Everything else works.",
    };
  }
}

/**
 * Splits a buffer of SSE text into complete `data:` payloads, returning any
 * incomplete trailing chunk so it can be prepended to the next read.
 */
export function parseSSE(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  const normalized = buffer.replace(/\r\n/g, "\n");
  const parts = normalized.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    const data = part
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).replace(/^ /, ""))
      .join("\n");
    if (!data) continue;
    try {
      events.push(JSON.parse(data) as StreamEvent);
    } catch {
      // Ignore malformed frames.
    }
  }
  return { events, rest };
}

export async function streamChat(
  bodyId: string,
  messages: ApiMessage[],
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ bodyId, messages }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ChatError("Couldn't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const json = (await res.json()) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      if (res.status === 404 || res.status === 405) message = "Chat isn't available on this deployment.";
    }
    throw new ChatError(message);
  }
  if (!res.body || !res.headers.get("content-type")?.includes("text/event-stream")) {
    throw new ChatError("Chat isn't available on this deployment.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSSE(buffer);
      buffer = rest;
      for (const e of events) {
        if (e.type === "error") throw new ChatError(e.message);
        if (e.type === "done") finished = true;
        onEvent(e);
      }
    }
  } catch (err) {
    if (err instanceof ChatError || (err as Error).name === "AbortError") throw err;
    throw new ChatError("The connection dropped before the answer finished. Please try again.");
  }
  if (!finished) throw new ChatError("The connection dropped before the answer finished. Please try again.");
}
