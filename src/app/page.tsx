import Link from "next/link";
import { SummaryCard } from "@/components/SummaryCard";
import { Footer, Wordmark } from "@/components/ui";
import { config } from "@/lib/config";

const previewData = {
  weekRange: "13 – 19 Jul",
  energy: "okay",
  priorities: [
    { content: "Send the proposal that's been sitting in drafts", firstStep: "open the doc, nothing else" },
    { content: "Two runs. Not five. Two.", firstStep: "shoes by the door tonight" },
    { content: "Book the dentist", firstStep: "it's a two-minute phone call" },
  ],
  frictionFix: "Proposal doc pinned as the first browser tab on Monday morning.",
  nextReset: "Sun 19:00",
};

export default function Landing() {
  return (
    <main className="flex-1">
      {/* Above the fold */}
      <section className="mx-auto flex min-h-[88svh] max-w-2xl flex-col px-6 pt-8">
        <Wordmark />
        <div className="flex flex-1 flex-col justify-center py-16">
          <h1 className="font-serif text-4xl leading-[1.15] sm:text-5xl">
            The weekly ritual for people who&rsquo;ve abandoned every planner
            they&rsquo;ve ever bought.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/70">
            Five minutes, once a week. Close out the week without judgment,
            pick three things that matter, and remove what&rsquo;s most likely
            to stop you. No streaks. No scores. No starting over.
          </p>
          <div className="mt-10 flex flex-col items-start gap-3">
            <Link
              href="/reset"
              className="rounded-full bg-ink px-8 py-4 text-[15px] font-medium text-paper transition-colors duration-200 hover:bg-ink/85"
            >
              Start your reset
            </Link>
            <p className="text-sm text-ink/50">Free. No signup. ~5 minutes.</p>
          </div>
        </div>
      </section>

      {/* Mechanism blocks */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-2xl gap-12 px-6 py-16 sm:gap-14">
          <div>
            <h2 className="font-serif text-2xl">Why there are no streaks</h2>
            <p className="mt-3 leading-relaxed text-ink/70">
              A system that breaks when you miss a day is a badly designed
              system. The Weekly Reset has no chain to break — miss a week and
              the next reset works exactly the same. Gaps aren&rsquo;t counted,
              displayed, or mentioned. They&rsquo;re not interesting.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl">Why forgiveness is a feature</h2>
            <p className="mt-3 leading-relaxed text-ink/70">
              Every reset starts by archiving what didn&rsquo;t happen — on
              purpose, with a button. Not because it didn&rsquo;t matter, but
              because carrying an old list into a new week is how planners die.
              Clearing the deck is engineering, not defeat.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl">Why three priorities, not ten</h2>
            <p className="mt-3 leading-relaxed text-ink/70">
              Three, because attention is finite — not because ten is immoral.
              A list of ten is a wish. A list of three, each with its biggest
              obstacle already removed, is a plan you can carry in your head on
              a Tuesday afternoon.
            </p>
          </div>
        </div>
      </section>

      {/* Card preview */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-serif text-2xl">You leave with this</h2>
          <p className="mt-3 leading-relaxed text-ink/70">
            One clean card: your three things, the friction you removed, and
            when you&rsquo;ll reset next. Download it, screenshot it, or let it
            go — it&rsquo;ll be here either way.
          </p>
          <div className="mt-8 flex justify-center">
            <div
              className="w-full max-w-[320px] overflow-hidden rounded-2xl border border-line shadow-[0_2px_24px_rgba(22,21,19,0.08)]"
              style={{ aspectRatio: "9/16" }}
            >
              <SummaryCard data={previewData} />
            </div>
          </div>
        </div>
      </section>

      {/* Store link, quiet */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <p className="leading-relaxed text-ink/70">
            The Weekly Reset closes the week. If you want the same mechanism
            running the days in between, that&rsquo;s what{" "}
            {config.stanStoreHabitTrackerUrl ? (
              <a
                href={config.stanStoreHabitTrackerUrl}
                className="underline decoration-sage underline-offset-4 hover:text-ink"
              >
                the Forgiving Habit Tracker
              </a>
            ) : (
              <span>the Forgiving Habit Tracker</span>
            )}{" "}
            is for. When you&rsquo;re ready — the free ritual stands on its own.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
