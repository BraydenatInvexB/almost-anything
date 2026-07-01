import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";

export function cleanListingText(text: string): string {
  return text
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTitleFromMarkdown(markdown: string): string {
  const titleLine = markdown.match(/^Title:\s*(.+)$/m);
  let title = "";
  if (titleLine) {
    title = titleLine[1].split("|")[0].trim();
  } else {
    const h1 = markdown.match(/^#\s+(.+)$/m);
    if (h1) title = h1[1].trim();
  }

  if (!title) return "";

  title = title
    .replace(/\(\d+\s*L\)/i, (m) => m.replace(/\s+/, ""))
    .replace(/(\sAir Fryer\s*){2,}/gi, " Air Fryer")
    .replace(/^(.+?)\s+\1\s/i, "$1 ")
    .replace(/^(\S+)\s+\1\s/i, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (/^airfryers$/i.test(title.replace(/\s+air fryer/i, "").trim())) return "";

  return title;
}

function extractPriceRichMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const priceLines = lines.filter((line) =>
    /(?:US\$|R\s*[\d,]{1,}|\$\s*[\d,]{1,}|USD\s*[\d,]{1,}|FOB|MOQ|\/piece|ex\s*vat|incl\s*vat)/i.test(
      line,
    ),
  );
  if (priceLines.length) return priceLines.join("\n");
  return markdown.slice(0, 25_000);
}

export function parsePricesFromMarkdown(markdown: string): number[] {
  const header = extractPriceRichMarkdown(markdown);
  const prices: number[] = [];

  for (const match of header.matchAll(/R\s*([\d,]+)\s+(\d{2})(?:\s|$|\)|,)/g)) {
    const n = Number(`${match[1].replace(/,/g, "")}.${match[2]}`);
    if (Number.isFinite(n) && n >= 8 && n <= 500_000) prices.push(n);
  }

  for (const match of header.matchAll(/R\s*([\d,]+(?:\.\d{2})?)/gi)) {
    const n = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 8 && n <= 500_000) prices.push(n);
  }

  for (const match of header.matchAll(
    /(?:US\$|\$\s*|USD\s*)([\d,]+(?:\.\d{1,2})?)(?:\s*[-–]\s*(?:US\$|\$)?([\d,]+(?:\.\d{1,2})?))?/gi,
  )) {
    const low = Number((match[1] ?? "").replace(/,/g, ""));
    const high = match[2] ? Number(match[2].replace(/,/g, "")) : undefined;
    const usd = Number.isFinite(high) ? Math.min(low, high!) : low;
    if (Number.isFinite(usd) && usd >= 0.1 && usd <= 50_000) {
      prices.push(Math.round(usd * ZAR_PER_USD * 100) / 100);
    }
  }

  return prices;
}

export function pickListingPrice(prices: number[]): number | undefined {
  if (!prices.length) return undefined;
  const sorted = [...new Set(prices)].sort((a, b) => a - b);
  const micro = sorted.filter((p) => p >= 8 && p <= 250);
  if (micro.length) return micro[0];
  const shelf = sorted.filter((p) => p >= 199);
  if (shelf.length) return shelf[0];
  const fallback = sorted.filter((p) => p >= 15);
  return fallback[0] ?? sorted[0];
}

export function upgradeProductImageUrl(url: string): string {
  return url
    .replace(/\/fccp\/\d+\/\d+\//, "/fccp/800/800/")
    .replace(/\?q=\d+/, "?q=90");
}

export function buildDescriptionFromBullets(title: string, bullets: string[]): string {
  if (!bullets.length) return "";
  const lead = title.replace(/\s+/g, " ").trim();
  const facts = bullets.slice(0, 4).join(". ");
  return cleanListingText(`${lead}. ${facts}.`);
}
