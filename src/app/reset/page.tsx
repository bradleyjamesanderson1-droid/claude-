"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeDraft,
  defaultNextReset,
  loadDraft,
  newDraft,
  saveDraft,
  type Energy,
  type ResetDraft,
} from "@/lib/draft";
import { downloadIcs } from "@/lib/ics";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";
import {
  PrimaryButton,
  QuietButton,
  TextArea,
  TextField,
  Wordmark,
} from "@/components/ui";

export default function ResetWizard() {
  const router = useRouter();
  const [draft, setDraft] = useState<ResetDraft | null>(null);

  // localStorage is client-only; reading it in a lazy initializer would
  // mismatch the statically prerendered HTML, so hydrate-then-load it is.
  useEffect(() => {
    const existing = loadDraft();
    if (existing) {
      // Silently resume. Never mention that it was left unfinished.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(existing);
    } else {
      const fresh = newDraft();
      saveDraft(fresh);
      setDraft(fresh);
      track("reset_started");
    }
  }, []);

  const update = useCallback((patch: Partial<ResetDraft>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  }, []);

  const goTo = useCallback(
    (step: ResetDraft["step"]) => {
      track("reset_step_completed", { step });
      update({ step });
      window.scrollTo({ top: 0 });
    },
    [update]
  );

  const finish = useCallback(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      completeDraft(prev);
      return prev;
    });
    track("reset_completed");
    router.push("/reset/done");
  }, [router]);

  if (!draft) {
    return <main className="flex-1" aria-busy="true" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-16 pt-8">
      <div className="flex items-baseline justify-between">
        <Wordmark />
        <p className="text-sm text-ink/40">Step {draft.step} of 5</p>
      </div>
      <div className="flex flex-1 flex-col justify-center py-10">
        {draft.step === 1 && (
          <StepClose draft={draft} update={update} onNext={() => goTo(2)} />
        )}
        {draft.step === 2 && (
          <StepArchive
            draft={draft}
            update={update}
            onBack={() => update({ step: 1 })}
            onNext={() => goTo(3)}
          />
        )}
        {draft.step === 3 && (
          <StepPickThree
            draft={draft}
            update={update}
            onBack={() => update({ step: 2 })}
            onNext={() => goTo(4)}
          />
        )}
        {draft.step === 4 && (
          <StepFriction
            draft={draft}
            update={update}
            onBack={() => update({ step: 3 })}
            onNext={() => goTo(5)}
          />
        )}
        {draft.step === 5 && (
          <StepBookNext
            draft={draft}
            update={update}
            onBack={() => update({ step: 4 })}
            onFinish={finish}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Step 1: Close the week ---------- */

function StepClose({
  draft,
  update,
  onNext,
}: {
  draft: ResetDraft;
  update: (p: Partial<ResetDraft>) => void;
  onNext: () => void;
}) {
  const energies: { value: Energy; label: string }[] = [
    { value: "low", label: "Running low" },
    { value: "okay", label: "Okay" },
    { value: "good", label: "Good" },
  ];
  return (
    <section>
      <h1 className="font-serif text-3xl leading-tight">Close the week.</h1>
      <p className="mt-3 text-ink/60">
        What actually happened this week? Not what should have happened.
      </p>
      <div className="mt-8 space-y-6">
        <label className="block">
          <span className="text-sm text-ink/60">One thing that worked</span>
          <TextArea
            rows={2}
            className="mt-2"
            value={draft.worked}
            onChange={(e) => update({ worked: e.target.value })}
            placeholder="However small."
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink/60">One thing that didn&rsquo;t</span>
          <TextArea
            rows={2}
            className="mt-2"
            value={draft.didntWork}
            onChange={(e) => update({ didntWork: e.target.value })}
            placeholder="Just naming it. No verdict."
          />
        </label>
        <div>
          <span className="text-sm text-ink/60">Energy, honestly</span>
          <div className="mt-2 flex gap-2">
            {energies.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => update({ energy: e.value })}
                className={`flex-1 rounded-xl border px-3 py-3 text-sm transition-colors duration-200 ${
                  draft.energy === e.value
                    ? "border-sage bg-sage/10 text-ink"
                    : "border-line text-ink/70 hover:border-sage/60"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </section>
  );
}

/* ---------- Step 2: Forgive and clear ---------- */

function StepArchive({
  draft,
  update,
  onBack,
  onNext,
}: {
  draft: ResetDraft;
  update: (p: Partial<ResetDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [fading, setFading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const items = draft.clearItems;
  const setItem = (i: number, value: string) => {
    const next = [...items];
    next[i] = value;
    update({ clearItems: next });
  };
  const addItem = () => {
    if (items.length < 5) update({ clearItems: [...items, ""] });
  };

  const archive = () => {
    setFading(true);
    timer.current = setTimeout(() => {
      update({
        archived: true,
        archivedItems: items.filter((s) => s.trim() !== ""),
        clearItems: [],
      });
    }, 1100);
  };

  const typedAnything = items.some((s) => s.trim() !== "");

  return (
    <section>
      <h1 className="font-serif text-3xl leading-tight">Forgive and clear.</h1>
      <p className="mt-3 text-ink/60">
        List anything you didn&rsquo;t get to. Then archive it.
      </p>

      {!draft.archived ? (
        <>
          <div className="mt-8 space-y-3">
            {(items.length === 0 ? [""] : items).map((item, i) => (
              <div
                key={i}
                className={`archive-fade max-h-24 ${fading ? "archived" : ""}`}
              >
                <TextField
                  value={item}
                  onChange={(e) => setItem(i, e.target.value)}
                  placeholder={i === 0 ? "The thing you keep re-writing on lists" : "Anything else"}
                  disabled={fading}
                />
              </div>
            ))}
          </div>
          {items.length > 0 && items.length < 5 && !fading && (
            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm text-ink/50 underline decoration-line underline-offset-4 hover:text-ink"
            >
              add another
            </button>
          )}
          <div className="mt-10 flex items-center gap-4">
            {typedAnything ? (
              <PrimaryButton onClick={archive} disabled={fading}>
                Archive the week
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={onNext}>Nothing to clear — continue</PrimaryButton>
            )}
            <QuietButton onClick={onBack}>Back</QuietButton>
          </div>
        </>
      ) : (
        <>
          <p className="mt-8 text-lg leading-relaxed">
            Gone. Not failed — finished with. Next week starts clean.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
            <QuietButton onClick={onBack}>Back</QuietButton>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------- Step 3: Pick three ---------- */

function StepPickThree({
  draft,
  update,
  onBack,
  onNext,
}: {
  draft: ResetDraft;
  update: (p: Partial<ResetDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [fourthAsked, setFourthAsked] = useState(false);

  const setPriority = (i: number, patch: Partial<ResetDraft["priorities"][number]>) => {
    const next = [...draft.priorities] as ResetDraft["priorities"];
    next[i] = { ...next[i], ...patch };
    update({ priorities: next });
  };

  return (
    <section>
      <h1 className="font-serif text-3xl leading-tight">Pick three.</h1>
      <p className="mt-3 text-ink/60">
        Choose the three things that would make next week feel handled. Three.
        Not ten.
      </p>
      <div className="mt-8 space-y-8">
        {draft.priorities.map((p, i) => (
          <div key={i}>
            <label className="block">
              <span className="text-sm text-ink/60">Priority {i + 1}</span>
              <TextField
                className="mt-2"
                value={p.content}
                onChange={(e) => setPriority(i, { content: e.target.value })}
                placeholder={["The one that matters most", "The second one", "And the third"][i]}
              />
            </label>
            <label className="mt-3 block">
              <TextField
                value={p.firstStep}
                onChange={(e) => setPriority(i, { firstStep: e.target.value })}
                placeholder="Smallest first step (optional)"
                className="text-sm"
              />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-6">
        {!fourthAsked ? (
          <button
            type="button"
            onClick={() => setFourthAsked(true)}
            className="text-sm text-ink/40 underline decoration-line underline-offset-4 hover:text-ink"
          >
            add a fourth?
          </button>
        ) : (
          <p className="text-sm text-sage-deep">
            That&rsquo;s the old system talking. Three.
          </p>
        )}
      </div>
      <div className="mt-10 flex items-center gap-4">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        <QuietButton onClick={onBack}>Back</QuietButton>
      </div>
    </section>
  );
}

/* ---------- Step 4: Lower the friction ---------- */

function StepFriction({
  draft,
  update,
  onBack,
  onNext,
}: {
  draft: ResetDraft;
  update: (p: Partial<ResetDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const setPriority = (i: number, patch: Partial<ResetDraft["priorities"][number]>) => {
    const next = [...draft.priorities] as ResetDraft["priorities"];
    next[i] = { ...next[i], ...patch };
    update({ priorities: next });
  };

  const active = draft.priorities
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.content.trim() !== "");

  return (
    <section>
      <h1 className="font-serif text-3xl leading-tight">Lower the friction.</h1>
      <p className="mt-3 text-ink/60">
        Willpower is what you use when the system is missing. Build the system
        instead: name the obstacle, then remove it now, while it&rsquo;s cheap.
      </p>
      <div className="mt-8 space-y-10">
        {active.length === 0 && (
          <p className="text-ink/60">
            No priorities named yet — you can go back and add some, or continue
            as is. Both are fine.
          </p>
        )}
        {active.map(({ p, i }) => (
          <div key={i} className="border-l-2 border-sage pl-4">
            <p className="font-serif text-lg">{p.content}</p>
            <label className="mt-4 block">
              <span className="text-sm text-ink/60">
                What&rsquo;s the one thing most likely to stop this from
                happening?
              </span>
              <TextField
                className="mt-2"
                value={p.friction}
                onChange={(e) => setPriority(i, { friction: e.target.value })}
                placeholder="Be specific. 'Tired at 6pm' counts."
              />
            </label>
            <label className="mt-3 block">
              <span className="text-sm text-ink/60">What removes that obstacle?</span>
              <TextField
                className="mt-2"
                value={p.frictionFix}
                onChange={(e) => setPriority(i, { frictionFix: e.target.value })}
                placeholder="Something you can set up in under five minutes."
              />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-10 flex items-center gap-4">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        <QuietButton onClick={onBack}>Back</QuietButton>
      </div>
    </section>
  );
}

/* ---------- Step 5: Book the next reset ---------- */

function toLocalInputValues(d: Date): { date: string; time: string } {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function StepBookNext({
  draft,
  update,
  onBack,
  onFinish,
}: {
  draft: ResetDraft;
  update: (p: Partial<ResetDraft>) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const initial = draft.nextResetAt ? new Date(draft.nextResetAt) : defaultNextReset();
  const [{ date, time }, setDt] = useState(toLocalInputValues(initial));

  useEffect(() => {
    const combined = new Date(`${date}T${time}`);
    if (!isNaN(combined.getTime())) {
      update({ nextResetAt: combined.toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  const nextDate = new Date(`${date}T${time}`);
  const valid = !isNaN(nextDate.getTime());

  const addToCalendar = () => {
    if (!valid) return;
    downloadIcs(nextDate, config.siteUrl);
    track("ics_downloaded");
    onFinish();
  };

  return (
    <section>
      <h1 className="font-serif text-3xl leading-tight">Book the next reset.</h1>
      <p className="mt-3 text-ink/60">
        A reset only works if it recurs. When&rsquo;s your next one?
      </p>
      <div className="mt-8 flex gap-3">
        <label className="flex-1">
          <span className="text-sm text-ink/60">Day</span>
          <TextField
            type="date"
            className="mt-2"
            value={date}
            onChange={(e) => setDt((s) => ({ ...s, date: e.target.value }))}
          />
        </label>
        <label className="flex-1">
          <span className="text-sm text-ink/60">Time</span>
          <TextField
            type="time"
            className="mt-2"
            value={time}
            onChange={(e) => setDt((s) => ({ ...s, time: e.target.value }))}
          />
        </label>
      </div>
      <div className="mt-10 flex flex-col items-start gap-3">
        <PrimaryButton onClick={addToCalendar} disabled={!valid}>
          Add to calendar
        </PrimaryButton>
        <p className="text-sm text-ink/50">
          A weekly recurring event, straight into your calendar. Email
          reminders arrive once saving is switched on.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <QuietButton onClick={onFinish}>Skip — I&rsquo;ll remember</QuietButton>
          <QuietButton onClick={onBack}>Back</QuietButton>
        </div>
      </div>
    </section>
  );
}
