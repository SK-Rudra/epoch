/** Section title over a dark rule, with a small mono note on the right (a count, a range, a total). */
export function SectionHead({ title, note }: { title: string; note?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
      <h2 className="text-lg">{title}</h2>
      {note != null && <span className="font-mono text-xs text-graphite">{note}</span>}
    </div>
  );
}
