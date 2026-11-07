/** Minimal horizontal bar list: one hue, value labels, readable without colour. */
export function Bars({ title, items, empty }: { title: string; items: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="panel p-5" aria-labelledby={`bars-${title}`}>
      <h2 id={`bars-${title}`} className="text-[15px] font-semibold">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-faint">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.label}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate text-ink-muted">{i.label}</span>
                <span className="font-semibold tabular-nums text-ink">{i.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-mist" aria-hidden="true">
                <div className="h-full rounded-full bg-signal" style={{ width: `${(i.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
