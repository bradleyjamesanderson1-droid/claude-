/**
 * Drawer with a searchable list of every body. Moons are nested under their
 * planet so tiny ones are one click away.
 */
import { BODIES, moonsOf, TYPE_LABEL, type Body } from "../data/bodies.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export class BodyList {
  private readonly drawer = $<HTMLElement>("drawer");
  private readonly button = $<HTMLButtonElement>("menu-btn");
  private readonly search = $<HTMLInputElement>("search");
  private readonly list = $<HTMLUListElement>("body-list");
  private current: string | null = null;

  constructor(private readonly onSelect: (id: string) => void) {
    this.button.addEventListener("click", () => (this.isOpen ? this.close() : this.open()));
    $("drawer-close").addEventListener("click", () => this.close(true));
    this.search.addEventListener("input", () => this.render());
    this.search.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = this.list.querySelector<HTMLButtonElement>("button");
        first?.click();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.list.querySelector<HTMLButtonElement>("button")?.focus();
      }
    });
    this.list.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const buttons = [...this.list.querySelectorAll<HTMLButtonElement>("button")];
      const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === "ArrowDown" ? buttons[i + 1] : i <= 0 ? this.search : buttons[i - 1];
      next?.focus();
    });
    this.render();
  }

  get isOpen(): boolean {
    return !this.drawer.hidden;
  }

  open() {
    this.drawer.hidden = false;
    this.button.setAttribute("aria-expanded", "true");
    this.search.focus();
    this.search.select();
  }

  close(returnFocus = false) {
    this.drawer.hidden = true;
    this.button.setAttribute("aria-expanded", "false");
    if (returnFocus) this.button.focus();
  }

  setCurrent(id: string | null) {
    this.current = id;
    for (const b of this.list.querySelectorAll<HTMLButtonElement>("button[data-id]")) {
      b.setAttribute("aria-current", String(b.dataset.id === id));
    }
  }

  private render() {
    const q = this.search.value.trim().toLowerCase();
    const matches = (b: Body) =>
      !q || b.name.toLowerCase().includes(q) || TYPE_LABEL[b.type].toLowerCase().includes(q);
    const items: HTMLLIElement[] = [];
    const top = BODIES.filter((b) => !b.parentId);
    for (const b of top) {
      const moons = moonsOf(b.id).filter(matches);
      if (matches(b) || moons.length) items.push(this.item(b, false));
      // When searching, show matching moons even if the planet itself doesn't match.
      for (const m of q ? moons : moonsOf(b.id)) items.push(this.item(m, true));
    }
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Nothing matches that.";
      items.push(li);
    }
    this.list.replaceChildren(...items);
  }

  private item(b: Body, isMoon: boolean): HTMLLIElement {
    const li = document.createElement("li");
    if (isMoon) li.className = "moon";
    const btn = document.createElement("button");
    btn.dataset.id = b.id;
    btn.setAttribute("aria-current", String(b.id === this.current));
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = b.color;
    const name = document.createElement("span");
    name.textContent = b.name;
    const kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = isMoon ? "" : TYPE_LABEL[b.type];
    btn.append(sw, name, kind);
    btn.addEventListener("click", () => {
      this.onSelect(b.id);
      // On narrow screens the drawer would cover the panel; close it.
      if (window.innerWidth < 900) this.close();
    });
    li.append(btn);
    return li;
  }
}
