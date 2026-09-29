/**
 * Side panel (bottom sheet on phones): stats, facts, moons, and the chat box.
 */
import { moonsOf, parentOf, TYPE_LABEL, type Body } from "../data/bodies.ts";
import type { ChatStore, ChatItem } from "../chat/store.ts";
import type { Health } from "../chat/api.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class InfoPanel {
  private readonly el = $<HTMLElement>("panel");
  private readonly title = $("panel-title");
  private readonly sub = $("panel-sub");
  private readonly stats = $("panel-stats");
  private readonly facts = $("panel-facts");
  private readonly moonsSec = $("panel-moons-sec");
  private readonly moons = $("panel-moons");
  private readonly log = $("chat-log");
  private readonly chips = $("chat-chips");
  private readonly form = $<HTMLFormElement>("chat-form");
  private readonly input = $<HTMLTextAreaElement>("chat-input");
  private readonly send = $<HTMLButtonElement>("chat-send");
  private readonly clear = $<HTMLButtonElement>("chat-clear");
  private readonly unavailable = $("chat-unavailable");
  private readonly scroller = this.el.querySelector<HTMLElement>(".panel-scroll")!;
  private body: Body | null = null;
  private health: Health = { chat: false, reason: "Checking whether chat is available…" };

  constructor(
    private readonly store: ChatStore,
    private readonly onSelect: (id: string) => void,
    private readonly onClose: () => void,
  ) {
    $("panel-close").addEventListener("click", () => this.onClose());
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.ask(this.input.value);
    });
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.ask(this.input.value);
      }
    });
    this.clear.addEventListener("click", () => {
      if (this.body) this.store.clear(this.body.id);
      this.input.focus();
    });
    store.subscribe((id) => {
      if (id === this.body?.id) this.renderChat();
    });
    // Tap the grip to expand/collapse the bottom sheet on phones.
    this.el.querySelector(".panel-grip")!.addEventListener("click", () => this.el.classList.toggle("expanded"));
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  setHealth(h: Health) {
    this.health = h;
    this.renderChat();
  }

  open(body: Body) {
    const same = this.body?.id === body.id;
    this.body = body;
    this.el.hidden = false;
    if (same) return;
    this.el.classList.remove("expanded");
    this.title.textContent = body.name;

    const parent = parentOf(body);
    this.sub.replaceChildren(TYPE_LABEL[body.type]);
    if (parent) {
      const b = document.createElement("button");
      b.textContent = parent.name;
      b.addEventListener("click", () => this.onSelect(parent.id));
      this.sub.append(" of ", b);
    } else if (body.type !== "star") {
      this.sub.append(" orbiting the Sun");
    } else {
      this.sub.append(" at the centre of the Solar System");
    }

    this.stats.replaceChildren(
      ...body.keyStats.map((s) => {
        const d = document.createElement("div");
        if (s.label === "Notable" || s.value.length > 28) d.className = "wide";
        const dt = document.createElement("dt");
        dt.textContent = s.label;
        const dd = document.createElement("dd");
        dd.textContent = s.value;
        d.append(dt, dd);
        return d;
      }),
    );

    this.facts.replaceChildren(
      ...body.facts.map((f) => {
        const li = document.createElement("li");
        li.textContent = f;
        return li;
      }),
    );

    const moons = moonsOf(body.id);
    this.moonsSec.hidden = moons.length === 0;
    this.moons.replaceChildren(
      ...moons.map((m) => {
        const b = document.createElement("button");
        b.className = "chip";
        b.textContent = m.name;
        b.addEventListener("click", () => this.onSelect(m.id));
        return b;
      }),
    );

    this.input.value = "";
    this.scroller.scrollTop = 0;
    this.renderChat();
  }

  close() {
    this.el.hidden = true;
    this.body = null;
  }

  /** Put focus in the panel (used when a body is chosen from the keyboard list). */
  focus() {
    $("panel-close").focus();
  }

  private ask(text: string) {
    if (!this.body || !text.trim() || !this.health.chat) return;
    const id = this.body.id;
    this.input.value = "";
    void this.store.ask(id, text);
  }

  private renderChat() {
    const body = this.body;
    if (!body) return;
    const convo = this.store.get(body.id);
    const enabled = this.health.chat;

    this.unavailable.hidden = enabled;
    this.unavailable.textContent = this.health.reason ?? "";
    this.input.disabled = !enabled;
    this.send.disabled = !enabled || convo.pending;
    this.clear.hidden = convo.items.length === 0;

    const nearBottom = this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight < 80;
    this.log.replaceChildren(...convo.items.map((m) => renderItem(m)));
    if (nearBottom || convo.pending) this.scroller.scrollTop = this.scroller.scrollHeight;

    // Chips: suggested questions not yet asked.
    const asked = new Set(convo.items.filter((i) => i.role === "user").map((i) => i.text));
    const remaining = body.suggestedQuestions.filter((q) => !asked.has(q));
    this.chips.replaceChildren(
      ...remaining.map((q) => {
        const b = document.createElement("button");
        b.className = "chip";
        b.type = "button";
        b.textContent = q;
        b.disabled = !enabled || convo.pending;
        b.addEventListener("click", () => {
          this.input.value = q;
          this.ask(q);
        });
        return b;
      }),
    );
  }
}

function renderItem(m: ChatItem): HTMLElement {
  const div = document.createElement("div");
  div.className = `msg ${m.role}`;
  if (m.role === "assistant" && m.streaming) {
    div.classList.add("streaming");
    if (!m.text) {
      div.classList.add("thinking");
      div.textContent = "Thinking";
      return div;
    }
  }
  const paras = m.text.split(/\n{2,}/);
  for (const p of paras) {
    const el = document.createElement("p");
    el.textContent = p.replace(/\*\*(.+?)\*\*/g, "$1");
    div.append(el);
  }
  return div;
}
