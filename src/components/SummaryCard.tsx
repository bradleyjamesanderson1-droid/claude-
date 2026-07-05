// The shareable artifact of a completed reset. Designed to screenshot
// cleanly at 9:16 — it doubles as the app's marketing surface.

export interface SummaryCardData {
  weekRange: string;
  energy: string | null;
  priorities: { content: string; firstStep: string }[];
  frictionFix: string | null;
  nextReset: string | null;
}

export function SummaryCard({ data }: { data: SummaryCardData }) {
  const priorities = data.priorities.filter((p) => p.content.trim() !== "");
  return (
    <div className="flex h-full w-full flex-col bg-paper px-8 py-10 text-ink">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
        weekly reset
      </p>
      <h2 className="mt-1 font-serif text-2xl">{data.weekRange}</h2>

      <div className="mt-8 flex-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-sage-deep">
          next week, three things
        </p>
        <ol className="mt-4 space-y-5">
          {priorities.length === 0 && (
            <li className="text-ink/60">A quiet week. That counts too.</li>
          )}
          {priorities.map((p, i) => (
            <li key={i} className="border-l-2 border-sage pl-4">
              <p className="font-serif text-lg leading-snug">{p.content}</p>
              {p.firstStep.trim() !== "" && (
                <p className="mt-1 text-sm text-ink/60">
                  starts with: {p.firstStep}
                </p>
              )}
            </li>
          ))}
        </ol>

        {data.frictionFix && (
          <div className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-sage-deep">
              friction, removed
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              {data.frictionFix}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-end justify-between border-t border-line pt-4">
        <p className="text-sm text-ink/60">
          {data.nextReset ? `next reset: ${data.nextReset}` : "see you next week"}
        </p>
        <p className="font-serif text-sm lowercase text-ink/40">undisciplined</p>
      </div>
    </div>
  );
}
