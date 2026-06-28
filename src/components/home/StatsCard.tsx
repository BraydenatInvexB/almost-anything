const AVATAR_COLORS = [
  "bg-violet-400",
  "bg-sky-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
];

const AVATAR_INITIALS = ["R", "A", "S", "M", "K"];

export function StatsCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-brand p-6 shadow-sm">
      {/* Avatar stack */}
      <div className="flex -space-x-2.5">
        {AVATAR_INITIALS.map((initial, i) => (
          <div
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand text-[10px] font-bold text-white ${AVATAR_COLORS[i]}`}
          >
            {initial}
          </div>
        ))}
      </div>

      {/* Big stat */}
      <div className="text-center">
        <p className="text-4xl font-extrabold leading-none tracking-tight text-white">
          1.2k+
        </p>
        <p className="mt-1 text-xs font-semibold text-white/85">
          Products in Stock
        </p>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <span className="text-[11px] font-semibold text-white/85">4.8 reviews</span>
      </div>
    </div>
  );
}
