import {
  AlertTriangle,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
import type { DeliveryJobRow } from "@/services/delivery/jobs";
import {
  formatAddress,
  formatCollectionAddress,
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
} from "@/lib/delivery/maps";

type RouteJob = Pick<
  DeliveryJobRow,
  | "collectionStops"
  | "customerName"
  | "customerPhone"
  | "customerEmail"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "province"
  | "postalCode"
  | "itemCount"
>;

export function DeliveryRouteManifest({
  job,
  collapsible = false,
}: {
  job: RouteJob;
  collapsible?: boolean;
}) {
  const collectionAddresses = job.collectionStops.map(formatCollectionAddress).filter(Boolean);
  const customerAddress = formatAddress([
    job.addressLine1,
    job.addressLine2,
    job.city,
    job.province,
    job.postalCode,
    "South Africa",
  ]);
  const fullRouteUrl = googleMapsDirectionsUrl([
    ...collectionAddresses,
    customerAddress,
  ]);
  const totalStops = job.collectionStops.length + 1;

  const content = (
    <div className="space-y-3">
      {fullRouteUrl ? (
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-900">Complete route</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {job.collectionStops.length} collection{job.collectionStops.length === 1 ? "" : "s"} and 1 customer delivery
            </p>
          </div>
          <a
            href={fullRouteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            <Navigation className="h-3.5 w-3.5" /> Open full route
          </a>
        </div>
      ) : null}

      <ol className="space-y-3">
        {job.collectionStops.map((stop, index) => {
          const address = formatCollectionAddress(stop);
          return (
            <li key={stop.id} className="relative rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <Store className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Collection {index + 1} of {job.collectionStops.length}
                      </p>
                      <h4 className="mt-0.5 font-semibold text-neutral-950">{stop.shopName}</h4>
                    </div>
                    {address ? (
                      <a
                        href={googleMapsSearchUrl(address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                      >
                        <MapPin className="h-3.5 w-3.5" /> Open map
                      </a>
                    ) : null}
                  </div>

                  {address ? (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">{address}</p>
                  ) : (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> Collection address has not been supplied
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-neutral-400" />
                      {stop.contactName || "Contact person not supplied"}
                    </span>
                    {stop.contactPhone ? (
                      <a href={`tel:${stop.contactPhone}`} className="inline-flex items-center gap-1.5 font-medium hover:text-brand">
                        <Phone className="h-3.5 w-3.5 text-neutral-400" /> {stop.contactPhone}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-neutral-400">
                        <Phone className="h-3.5 w-3.5" /> No phone supplied
                      </span>
                    )}
                    {stop.contactEmail ? (
                      <a href={`mailto:${stop.contactEmail}`} className="inline-flex min-w-0 items-center gap-1.5 font-medium hover:text-brand">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate">{stop.contactEmail}</span>
                      </a>
                    ) : null}
                  </div>

                  {stop.items.length ? (
                    <div className="mt-3 border-t border-neutral-100 pt-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        <Package className="h-3 w-3" /> Collect here
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {stop.items.map((item, itemIndex) => (
                          <span
                            key={`${stop.id}-${item.name}-${itemIndex}`}
                            className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700"
                          >
                            {item.quantity} × {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}

        <li className="rounded-xl border border-brand/20 bg-brand/[0.025] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                    Stop {totalStops} · Customer delivery
                  </p>
                  <h4 className="mt-0.5 font-semibold text-neutral-950">
                    {job.customerName || "Customer"}
                  </h4>
                </div>
                {customerAddress ? (
                  <a
                    href={googleMapsSearchUrl(customerAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Open map
                  </a>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                {customerAddress || "Customer delivery address unavailable"}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
                {job.customerPhone ? (
                  <a href={`tel:${job.customerPhone}`} className="inline-flex items-center gap-1.5 font-semibold hover:text-brand">
                    <Phone className="h-3.5 w-3.5 text-neutral-400" /> {job.customerPhone}
                  </a>
                ) : (
                  <span className="text-neutral-400">Customer phone not supplied</span>
                )}
                {job.customerEmail ? (
                  <a href={`mailto:${job.customerEmail}`} className="inline-flex min-w-0 items-center gap-1.5 font-medium hover:text-brand">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{job.customerEmail}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );

  if (!collapsible) return content;

  return (
    <details className="group rounded-xl border border-neutral-200 bg-neutral-50/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-xs font-semibold text-neutral-800 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <Navigation className="h-4 w-4 text-brand" />
          View route, addresses and contacts
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-neutral-500 ring-1 ring-neutral-200">
            {totalStops} stops
          </span>
        </span>
        <span className="text-neutral-400 transition group-open:rotate-90">›</span>
      </summary>
      <div className="border-t border-neutral-200 p-4">{content}</div>
    </details>
  );
}
