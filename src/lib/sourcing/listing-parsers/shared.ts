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

export function parsePricesFromMarkdown(markdown: string): number[] {
  const header = markdown.slice(0, 5000);
  const prices: number[] = [];

  for (const match of header.matchAll(/R\s*([\d,]+)\s+(\d{2})(?:\s|$|\)|,)/g)) {
    const n = Number(`${match[1].replace(/,/g, "")}.${match[2]}`);
    if (Number.isFinite(n) && n >= 29 && n <= 500_000) prices.push(n);
  }

  for (const match of header.matchAll(/R\s*([\d,]+(?:\.\d{2})?)/gi)) {
    const n = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 29 && n <= 500_000) prices.push(n);
  }

  return prices;
}

export function pickListingPrice(prices: number[]): number | undefined {
  if (!prices.length) return undefined;
  const sorted = [...new Set(prices)].sort((a, b) => a - b);
  const shelf = sorted.filter((p) => p >= 199);
  if (shelf.length) return shelf[0];
  const fallback = sorted.filter((p) => p >= 99);
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
