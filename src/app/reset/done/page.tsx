"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { SummaryCard, type SummaryCardData } from "@/components/SummaryCard";
import { formatWeekRange, loadLastReset, type ResetDraft } from "@/lib/draft";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";
import { Footer, PrimaryButton, TextField, Wordmark } from "@/components/ui";

function cardData(reset: ResetDraft): SummaryCardData {
  const priorities = reset.priorities.filter((p) => p.content.trim() !== "");
  const topFix =
    priorities.map((p) => p.frictionFix.trim()).find((f) => f !== "") ?? null;
  const next = reset.nextResetAt
    ? new Date(reset.nextResetAt).toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return {
    weekRange: formatWeekRange(reset.completedAt ?? reset.startedAt),
    energy: reset.energy,
    priorities,
    frictionFix: topFix,
    nextReset: next,
  };
}

export default function ResetDone() {
  const [reset, setReset] = useState<ResetDraft | null | undefined>(undefined);
  const exportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // localStorage is client-only; see the matching note in reset/page.tsx.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReset(loadLastReset());
  }, []);

  if (reset === undefined) {
    return <main className="flex-1" aria-busy="true" />;
  }

  if (reset === null) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-8">
        <Wordmark />
        <div className="flex flex-1 flex-col justify-center py-16">
          <h1 className="font-serif text-3xl">No reset here yet.</h1>
          <p className="mt-3 text-ink/60">
            Five minutes, whenever suits you.
          </p>
          <Link
            href="/reset"
            className="mt-8 w-fit rounded-full bg-ink px-7 py-3.5 text-[15px] font-medium text-paper transition-colors duration-200 hover:bg-ink/85"
          >
            Start a reset
          </Link>
        </div>
      </main>
    );
  }

  const data = cardData(reset);

  const download = async () => {
    if (!exportRef.current || downloading) return;
    setDownloading(true);
    try {
      const png = await toPng(exportRef.current, {
        pixelRatio: 3, // 360×640 node → 1080×1920 image
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = png;
      a.download = "weekly-reset.png";
      a.click();
      track("card_downloaded");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-xl px-6 pb-16 pt-8">
        <Wordmark />
        <div className="py-10">
          <h1 className="font-serif text-3xl leading-tight">
            That&rsquo;s the week, handled.
          </h1>
          <p className="mt-3 text-ink/60">
            Three things, the friction removed, the next reset booked. Here&rsquo;s
            your card.
          </p>

          {/* Visible card */}
          <div className="mt-8 flex justify-center">
            <div
              className="w-full max-w-[320px] overflow-hidden rounded-2xl border border-line shadow-[0_2px_24px_rgba(22,21,19,0.08)]"
              style={{ aspectRatio: "9/16" }}
            >
              <SummaryCard data={data} />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <PrimaryButton onClick={download} disabled={downloading}>
              {downloading ? "Rendering…" : "Download card"}
            </PrimaryButton>
          </div>

          {/* Export node: fixed 360×640, off-screen, rendered at 3× for 1080×1920 */}
          <div className="pointer-events-none fixed -left-[9999px] top-0">
            <div ref={exportRef} style={{ width: 360, height: 640 }}>
              <SummaryCard data={data} />
            </div>
          </div>

          <EmailCapture />

          <ProductBridge />
        </div>
      </div>
      <Footer />
    </main>
  );
}

function EmailCapture() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "offline">(
    "idle"
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          consentMarketing: consent,
          consentSource: "reset_done_card",
        }),
      });
      if (res.ok) {
        setState("sent");
        track("email_captured", { source: "card" });
      } else {
        setState("offline");
      }
    } catch {
      setState("offline");
    }
  };

  return (
    <section className="mt-14 rounded-2xl border border-line bg-white/50 p-6">
      <h2 className="font-serif text-xl">Want this saved?</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Enter your email and I&rsquo;ll keep your reset history here, send you
        this card, and send the Notion version of the ritual so it lives inside
        your workspace.
      </p>
      {state === "sent" ? (
        <p className="mt-4 text-sm text-sage-deep">
          Check your inbox — a link is on its way.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <TextField
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@wherever.com"
              autoComplete="email"
            />
            <PrimaryButton type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Save my resets"}
            </PrimaryButton>
          </div>
          <label className="flex items-start gap-2 text-xs leading-relaxed text-ink/60">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 accent-[#7a8b74]"
            />
            <span>
              Also send me occasional Undisciplined emails about systems that
              survive imperfect weeks. Optional — your card and history arrive
              either way. Unsubscribe anytime.
            </span>
          </label>
          {state === "offline" && (
            <p className="text-sm text-ink/60">
              Saving isn&rsquo;t switched on just yet — download your card
              above and it&rsquo;s yours. Email history is coming shortly.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

function ProductBridge() {
  return (
    <section className="mt-10">
      <p className="leading-relaxed text-ink/70">
        The Weekly Reset closes the week. The Forgiving Habit Tracker runs the
        days in between — same mechanism, built to survive missed days. R180.
      </p>
      <div className="mt-4 flex flex-col items-start gap-3">
        {config.stanStoreHabitTrackerUrl ? (
          <a
            href={config.stanStoreHabitTrackerUrl}
            onClick={() => track("store_click", { product: "habit_tracker" })}
            className="rounded-full border border-sage px-6 py-3 text-[15px] text-sage-deep transition-colors duration-200 hover:bg-sage/10"
          >
            See the Forgiving Habit Tracker
          </a>
        ) : (
          <span className="text-sm text-ink/40">
            The Forgiving Habit Tracker — link coming with launch.
          </span>
        )}
        {config.stanStoreCalmBudgetUrl ? (
          <a
            href={config.stanStoreCalmBudgetUrl}
            onClick={() => track("store_click", { product: "calm_budget" })}
            className="text-sm text-ink/50 underline decoration-line underline-offset-4 hover:text-ink"
          >
            Money feeling the same way? The Calm Budget.
          </a>
        ) : null}
      </div>
    </section>
  );
}
