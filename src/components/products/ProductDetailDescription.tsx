import { Check } from "lucide-react";
import type { ProductEnrichment } from "@/types/product-enrichment";
import {
  buildCustomerProductCopy,
  customerFacingSpecifications,
} from "@/types/product-enrichment";

type Props = {
  enrichment: ProductEnrichment;
  description?: string | null;
};

export function ProductDetailDescription({ enrichment, description }: Props) {
  const { about, highlights } = buildCustomerProductCopy(description, enrichment);
  const specs = Object.entries(customerFacingSpecifications(enrichment.specifications));

  if (!about && !highlights.length && !specs.length) return null;

  return (
    <div className="mt-8 space-y-6 border-t border-neutral-100 pt-8">
      {about ? (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
            About this product
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{about}</p>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
            Key features
          </h2>
          <ul className="mt-3 space-y-2">
            {highlights.map((item, index) => (
              <li
                key={`${index}-${item.slice(0, 40)}`}
                className="flex items-start gap-2 text-sm text-neutral-700"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {specs.length > 0 ? (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
            Specifications
          </h2>
          <dl className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-neutral-50/50">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="font-medium text-neutral-500">{label}</dt>
                <dd className="text-right font-medium text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
