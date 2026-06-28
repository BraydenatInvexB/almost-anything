interface LiveTickerProps {
  items: string[];
}

export function LiveTicker({ items }: LiveTickerProps) {
  if (items.length === 0) return null;
  // Duplicate the list so the marquee loops seamlessly at -50%.
  const loop = [...items, ...items];

  return (
    <div className="marquee-paused relative overflow-hidden rounded-full border border-neutral-200 bg-white py-3 shadow-sm">
      {/* Edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-linear-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-linear-to-l from-white to-transparent" />

      <div className="flex w-max animate-marquee items-center gap-8 pr-8">
        {loop.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-3 text-sm font-medium text-neutral-700">
            <span className="h-1.5 w-1.5 rotate-45 bg-[#CDFF00]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
