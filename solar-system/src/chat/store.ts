/**
 * Per-body conversation history for the session. Switching bodies and coming
 * back keeps the thread; nothing is saved between visits.
 */
import { ChatError, streamChat, type ApiMessage } from "./api.ts";

/** Must match the server's LIMITS.conversationMessages. */
export const MAX_CONVERSATION_MESSAGES = 21;

export interface ChatItem {
  role: "user" | "assistant" | "error" | "notice";
  text: string;
  /** Assistant answer still arriving. */
  streaming?: boolean;
  /** Question whose answer failed; excluded from the history sent to the server. */
  failed?: boolean;
}

interface Conversation {
  items: ChatItem[];
  pending: boolean;
  controller?: AbortController;
}

type Listener = (bodyId: string) => void;

export class ChatStore {
  private convos = new Map<string, Conversation>();
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(bodyId: string) {
    for (const fn of this.listeners) fn(bodyId);
  }

  get(bodyId: string): Conversation {
    let c = this.convos.get(bodyId);
    if (!c) {
      c = { items: [], pending: false };
      this.convos.set(bodyId, c);
    }
    return c;
  }

  /** Completed question/answer pairs, in API shape. */
  history(bodyId: string): ApiMessage[] {
    const out: ApiMessage[] = [];
    const items = this.get(bodyId).items;
    for (let i = 0; i < items.length; i++) {
      const q = items[i];
      const a = items[i + 1];
      if (q.role === "user" && !q.failed && a?.role === "assistant" && !a.streaming && a.text.trim()) {
        out.push({ role: "user", content: q.text }, { role: "assistant", content: a.text });
        i++;
      }
    }
    return out;
  }

  atLimit(bodyId: string): boolean {
    return this.history(bodyId).length + 1 > MAX_CONVERSATION_MESSAGES;
  }

  clear(bodyId: string) {
    const c = this.get(bodyId);
    c.controller?.abort();
    this.convos.set(bodyId, { items: [], pending: false });
    this.emit(bodyId);
  }

  async ask(bodyId: string, question: string) {
    const c = this.get(bodyId);
    const text = question.trim();
    if (!text || c.pending) return;
    if (this.atLimit(bodyId)) {
      c.items.push({ role: "notice", text: "This conversation has reached its length limit. Clear it to start a fresh one." });
      this.emit(bodyId);
      return;
    }
    const messages: ApiMessage[] = [...this.history(bodyId), { role: "user", content: text }];
    const q: ChatItem = { role: "user", text };
    const a: ChatItem = { role: "assistant", text: "", streaming: true };
    c.items.push(q, a);
    c.pending = true;
    c.controller = new AbortController();
    this.emit(bodyId);

    try {
      await streamChat(
        bodyId,
        messages,
        (e) => {
          if (e.type === "text") a.text += e.text;
          else if (e.type === "notice") c.items.push({ role: "notice", text: e.text });
          this.emit(bodyId);
        },
        c.controller.signal,
      );
      a.streaming = false;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      a.streaming = false;
      q.failed = true;
      const idx = c.items.indexOf(a);
      const message = err instanceof ChatError ? err.message : "Something went wrong. Please try again.";
      // Keep any partial text visible, but mark the exchange as failed.
      if (idx >= 0 && !a.text.trim()) c.items.splice(idx, 1, { role: "error", text: message });
      else c.items.push({ role: "error", text: message });
      if (a.text.trim()) a.text += " …";
    } finally {
      if (this.convos.get(bodyId) === c) {
        c.pending = false;
        c.controller = undefined;
        this.emit(bodyId);
      }
    }
  }
}
