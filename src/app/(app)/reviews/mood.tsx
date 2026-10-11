// Shared by the form (client) and the history list (server), so no "use client" here.

export const MOODS = ["Rough", "Meh", "Okay", "Good", "Great"]; // mood 1–5

/**
 * Five rising bars, filled up to the mood: reads at a glance, and by shape, not only colour.
 * tone="current" draws in the text colour, for use on the dark selected mood button.
 */
export function MoodMark({ mood, tone = "plot" }: { mood: number; tone?: "plot" | "current" }) {
  const [on, off] = tone === "plot" ? ["fill-plot", "fill-grid"] : ["fill-current", "fill-current opacity-30"];
  return (
    <svg viewBox="0 0 22 12" className="h-3 w-[22px]" role="img" aria-label={`Mood ${mood} of 5, ${MOODS[mood - 1]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <rect key={n} x={(n - 1) * 4.5} y={12 - n * 2.4} width={3} height={n * 2.4} rx={0.75} className={n <= mood ? on : off} />
      ))}
    </svg>
  );
}
