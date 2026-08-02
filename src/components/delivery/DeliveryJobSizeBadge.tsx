/** Shared size/vehicle chip for delivery job lists (admin, seller, driver). */
export function DeliveryJobSizeBadge({
  label,
  vehicleHint,
  mayNeedTwoPeople,
}: {
  label: string;
  vehicleHint: string;
  mayNeedTwoPeople?: boolean;
}) {
  return (
    <div className="mt-2 space-y-1">
      <p className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900">
        {label}
        {mayNeedTwoPeople ? " · 2 people" : ""}
      </p>
      <p className="text-[11px] text-neutral-500">{vehicleHint}</p>
    </div>
  );
}
