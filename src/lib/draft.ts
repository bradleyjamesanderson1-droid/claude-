// Anonymous reset state, persisted to localStorage after every input.
// An interrupted reset resumes exactly where it stopped — this is the
// anti-shame mechanic in code form. Never surface "you didn't finish."

export type Energy = "low" | "okay" | "good";

export interface Priority {
  content: string;
  firstStep: string;
  friction: string;
  frictionFix: string;
}

export interface ResetDraft {
  version: 1;
  /** Links pre-signup localStorage resets to a Supabase row in Phase 2. */
  anonToken: string;
  startedAt: string;
  step: 1 | 2 | 3 | 4 | 5;
  worked: string;
  didntWork: string;
  energy: Energy | null;
  /** Items typed in step 2, before archiving. */
  clearItems: string[];
  /** Items the user archived. Retrievable in history later; never resurfaces uninvited. */
  archivedItems: string[];
  archived: boolean;
  priorities: [Priority, Priority, Priority];
  nextResetAt: string | null;
  completedAt: string | null;
}

const DRAFT_KEY = "wr.draft";
const LAST_KEY = "wr.lastReset";

const emptyPriority = (): Priority => ({
  content: "",
  firstStep: "",
  friction: "",
  frictionFix: "",
});

export function newDraft(): ResetDraft {
  return {
    version: 1,
    anonToken:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    startedAt: new Date().toISOString(),
    step: 1,
    worked: "",
    didntWork: "",
    energy: null,
    clearItems: [],
    archivedItems: [],
    archived: false,
    priorities: [emptyPriority(), emptyPriority(), emptyPriority()],
    nextResetAt: null,
    completedAt: null,
  };
}

export function loadDraft(): ResetDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResetDraft;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: ResetDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or unavailable — the reset still works in memory.
  }
}

/** Marks the draft complete and moves it to the "last reset" slot. */
export function completeDraft(draft: ResetDraft): ResetDraft {
  const done: ResetDraft = { ...draft, completedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LAST_KEY, JSON.stringify(done));
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Same forgiveness as above.
    }
  }
  return done;
}

export function loadLastReset(): ResetDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResetDraft;
  } catch {
    return null;
  }
}

/** The week being closed: Monday through Sunday containing the given date. */
export function weekRange(dateIso: string): { start: Date; end: Date } {
  const d = new Date(dateIso);
  const day = d.getDay(); // 0 = Sunday
  const sinceMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - sinceMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

export function formatWeekRange(dateIso: string): string {
  const { start, end } = weekRange(dateIso);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const startStr = start.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, {
    ...opts,
    year: end.getFullYear() !== start.getFullYear() ? "numeric" : undefined,
  });
  return `${startStr} – ${endStr}`;
}

/** Default next reset: same day and time, one week out, rounded to the hour. */
export function defaultNextReset(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setMinutes(0, 0, 0);
  return d;
}
