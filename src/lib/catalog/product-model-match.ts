/**
 * Strict model/variant matching — prevents "Xbox One X" from matching "Xbox One S"
 * when single-letter suffixes would otherwise be stripped from search tokens.
 */

type ModelRule = {
  /** Query must match this to activate the rule */
  queryPattern: RegExp;
  /** Product text must include this when the rule is active */
  requiredInProduct: RegExp;
  /** Reject product if it matches any of these without also matching requiredInProduct */
  conflicts: RegExp[];
};

const MODEL_RULES: ModelRule[] = [
  {
    queryPattern: /\bxbox\s*one\s*x\b/i,
    requiredInProduct: /\bxbox\s*one\s*x\b/i,
    conflicts: [/\bxbox\s*one\s*s\b/i, /\bxbox\s*one\s*slim\b/i],
  },
  {
    queryPattern: /\bxbox\s*one\s*s\b/i,
    requiredInProduct: /\bxbox\s*one\s*s\b/i,
    conflicts: [/\bxbox\s*one\s*x\b/i],
  },
  {
    queryPattern: /\bxbox\s*series\s*x\b/i,
    requiredInProduct: /\bxbox\s*series\s*x\b/i,
    conflicts: [/\bxbox\s*series\s*s\b/i],
  },
  {
    queryPattern: /\bxbox\s*series\s*s\b/i,
    requiredInProduct: /\bxbox\s*series\s*s\b/i,
    conflicts: [/\bxbox\s*series\s*x\b/i],
  },
  {
    queryPattern: /\b(ps5|playstation\s*5)\b/i,
    requiredInProduct: /\b(ps5|playstation\s*5)\b/i,
    conflicts: [/\b(ps4|playstation\s*4)\b/i],
  },
  {
    queryPattern: /\b(ps4|playstation\s*4)\b/i,
    requiredInProduct: /\b(ps4|playstation\s*4)\b/i,
    conflicts: [/\b(ps5|playstation\s*5)\b/i],
  },
  {
    queryPattern: /\bnintendo\s*switch\s*2\b/i,
    requiredInProduct: /\bnintendo\s*switch\s*2\b/i,
    conflicts: [/\bnintendo\s*switch\b(?!.*\b2\b)/i],
  },
];

/** Compound product phrases preserved as single search tokens. */
const COMPOUND_PHRASE_PATTERNS: RegExp[] = [
  /\bxbox\s+one\s+x\b/i,
  /\bxbox\s+one\s+s\b/i,
  /\bxbox\s+series\s+x\b/i,
  /\bxbox\s+series\s+s\b/i,
  /\bplaystation\s+5\b/i,
  /\bplaystation\s+4\b/i,
  /\bnintendo\s+switch\s+2\b/i,
  /\biphone\s+\d{1,2}\s+pro\s+max\b/i,
  /\biphone\s+\d{1,2}\s+pro\b/i,
  /\biphone\s+\d{1,2}\b/i,
  /\bgalaxy\s+s\d{1,2}\b/i,
  /\bairpods\s+pro\b/i,
  /\bairpods\s+max\b/i,
];

function normalizeBlob(parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function iphoneGenerationRule(query: string, blob: string): boolean | null {
  const qMatch = query.match(/\biphone\s*(\d{1,2})\b/i);
  if (!qMatch) return null;
  const gen = qMatch[1];
  const required = new RegExp(`\\biphone\\s*${gen}\\b`, "i");
  if (required.test(blob)) return true;
  const productGen = blob.match(/\biphone\s*(\d{1,2})\b/i);
  if (productGen && productGen[1] !== gen) return false;
  return null;
}

function galaxyGenerationRule(query: string, blob: string): boolean | null {
  const qMatch = query.match(/\bgalaxy\s*s(\d{1,2})\b/i);
  if (!qMatch) return null;
  const gen = qMatch[1];
  const required = new RegExp(`\\bgalaxy\\s*s${gen}\\b`, "i");
  if (required.test(blob)) return true;
  const productGen = blob.match(/\bgalaxy\s*s(\d{1,2})\b/i);
  if (productGen && productGen[1] !== gen) return false;
  return null;
}

/**
 * Returns false when product text clearly conflicts with a specific model in the query
 * (e.g. query "xbox one x" vs product "xbox one s").
 */
export function productMatchesModelIntent(
  query: string,
  ...textParts: (string | undefined)[]
): boolean {
  const q = query.trim();
  if (!q) return true;

  const blob = normalizeBlob(textParts);

  const iphone = iphoneGenerationRule(q, blob);
  if (iphone === false) return false;

  const galaxy = galaxyGenerationRule(q, blob);
  if (galaxy === false) return false;

  for (const rule of MODEL_RULES) {
    if (!rule.queryPattern.test(q)) continue;

    if (rule.requiredInProduct.test(blob)) return true;

    for (const conflict of rule.conflicts) {
      if (conflict.test(blob)) return false;
    }
  }

  return true;
}

/** Extract multi-word model phrases before tokenization splits them apart. */
export function extractCompoundSearchPhrases(query: string): string[] {
  const q = query.toLowerCase().trim();
  const found: string[] = [];
  let scratch = q;

  for (const pattern of COMPOUND_PHRASE_PATTERNS) {
    const m = scratch.match(pattern);
    if (m) {
      found.push(m[0].replace(/\s+/g, " ").trim());
      scratch = scratch.replace(m[0], " ");
    }
  }

  return found;
}
