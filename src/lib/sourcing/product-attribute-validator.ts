/**
 * Keep discovered product names and specs aligned with listing evidence and search intent.
 */

export type MaterialKind = "genuine_leather" | "faux_leather" | "unknown";

export type MaterialIntent = "genuine" | "faux" | "neutral";

const GENUINE_LEATHER =
  /\bgenuine\s+leather\b|\breal\s+leather\b|\bfull[\s-]?grain\b|\btop[\s-]?grain\b|\b100\s*%\s*leather\b|\bcowhide\b|\bsheepskin\b|\blambskin\b|\bnappa\s+leather\b/i;

const FAUX_LEATHER =
  /\bfaux\s+leather\b|\bfaux\b|\bpu\s+leather\b|\bp\.?u\.?\s+leather\b|\bsynthetic\s+leather\b|\bvegan\s+leather\b|\bleatherette\b|\bimitation\s+leather\b|\bartificial\s+leather\b/i;

const LEATHER_PRODUCT = /\bleather\b/i;

export function detectMaterialIntent(query: string): MaterialIntent {
  const q = query.toLowerCase();
  if (FAUX_LEATHER.test(q)) return "faux";
  if (GENUINE_LEATHER.test(q)) return "genuine";
  if (LEATHER_PRODUCT.test(q) && !/\bfaux\b|\bpu\b|\bsynthetic\b|\bvegan\b/.test(q)) {
    return "genuine";
  }
  return "neutral";
}

export function detectMaterialFromText(...parts: string[]): MaterialKind {
  const text = parts.filter(Boolean).join(" ");
  if (!LEATHER_PRODUCT.test(text)) return "unknown";
  if (FAUX_LEATHER.test(text)) return "faux_leather";
  if (GENUINE_LEATHER.test(text)) return "genuine_leather";
  return "unknown";
}

function materialLabel(kind: MaterialKind): string | null {
  if (kind === "genuine_leather") return "Genuine leather";
  if (kind === "faux_leather") return "Faux leather";
  return null;
}

function stripMaterialPrefix(name: string): string {
  return name
    .replace(/\b(genuine|real|faux|pu|synthetic|vegan)\s+leather\b/gi, "leather")
    .replace(/\s+/g, " ")
    .trim();
}

function injectMaterialIntoName(name: string, kind: MaterialKind): string {
  const label =
    kind === "genuine_leather" ? "Genuine Leather" : kind === "faux_leather" ? "Faux Leather" : null;
  if (!label) return name;

  const lower = name.toLowerCase();
  if (lower.includes("genuine leather") || lower.includes("faux leather")) return name;
  if (lower.includes("leather")) {
    return name.replace(/\bleather\b/i, label);
  }
  return `${name} — ${label}`;
}

export type AttributeValidationInput = {
  query: string;
  name: string;
  description: string;
  summary: string;
  specifications: Record<string, string>;
  listingTitle?: string;
  listingSnippet?: string;
};

export type AttributeValidationResult = {
  name: string;
  description: string;
  summary: string;
  specifications: Record<string, string>;
  materialKind: MaterialKind;
  materialMismatch: boolean;
  rejected: boolean;
  rejectionReason?: string;
};

/**
 * Align product copy with listing material evidence. Reject options that contradict
 * a genuine-leather search when the listing clearly says faux/PU.
 */
export function validateProductAttributes(
  input: AttributeValidationInput,
): AttributeValidationResult {
  const intent = detectMaterialIntent(input.query);
  const listingMaterial = detectMaterialFromText(
    input.listingTitle ?? "",
    input.listingSnippet ?? "",
  );
  const copyMaterial = detectMaterialFromText(
    input.name,
    input.description,
    input.summary,
    Object.values(input.specifications).join(" "),
  );

  const materialKind =
    listingMaterial !== "unknown" ? listingMaterial : copyMaterial;

  let name = input.name;
  let description = input.description;
  let summary = input.summary;
  const specifications = { ...input.specifications };

  const materialMismatch =
    intent === "genuine" &&
    materialKind === "faux_leather" &&
    listingMaterial === "faux_leather";

  if (materialMismatch) {
    return {
      name,
      description,
      summary,
      specifications,
      materialKind,
      materialMismatch: true,
      rejected: true,
      rejectionReason: "Listing is faux/PU leather but search expects genuine leather",
    };
  }

  if (materialKind !== "unknown") {
    name = injectMaterialIntoName(stripMaterialPrefix(name), materialKind);
    const label = materialLabel(materialKind);
    if (label) {
      specifications.Material = label;
      if (materialKind === "faux_leather") {
        description = description.replace(/\bgenuine\s+leather\b/gi, "faux leather");
        summary = summary.replace(/\bgenuine\s+leather\b/gi, "faux leather");
      } else if (materialKind === "genuine_leather") {
        description = description.replace(/\bfaux\s+leather\b/gi, "genuine leather");
        summary = summary.replace(/\bfaux\s+leather\b/gi, "genuine leather");
      }
    }
  }

  return {
    name,
    description,
    summary,
    specifications,
    materialKind,
    materialMismatch: false,
    rejected: false,
  };
}

/** Boost wholesale hits that match material intent (e.g. genuine leather search). */
export function materialMatchBoost(query: string, title: string, snippet: string): number {
  const intent = detectMaterialIntent(query);
  if (intent === "neutral") return 0;

  const text = `${title} ${snippet}`;
  const material = detectMaterialFromText(text);

  if (intent === "genuine" && material === "genuine_leather") return 60;
  if (intent === "faux" && material === "faux_leather") return 40;
  if (intent === "genuine" && material === "faux_leather") return -120;
  if (intent === "faux" && material === "genuine_leather") return -40;
  return 0;
}
