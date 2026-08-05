import { HOME_TRUST_POINTS } from "@/config/home-marketplace";

export function HomeTrustStrip() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {HOME_TRUST_POINTS.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className="flex items-start gap-3.5 rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 sm:px-5 sm:py-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-brand">
            <Icon className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-neutral-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
