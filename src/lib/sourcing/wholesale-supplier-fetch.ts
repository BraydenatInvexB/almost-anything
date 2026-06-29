import {
  JINA_READER,
  USER_AGENT,
} from "@/lib/sourcing/wholesale-supplier-constants";

function isBlockedSearchContent(markdown: string): boolean {
  if (!markdown.trim()) return true;
  return /429|CAPTCHA|captcha|Too Many Requests|unusual traffic|abuse block/i.test(markdown);
}

export async function fetchPageMarkdown(pageUrl: string): Promise<string> {
  try {
    const res = await fetch(`${JINA_READER}${pageUrl}`, {
      headers: { Accept: "text/plain", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!res.ok) return "";
    const text = await res.text();
    return isBlockedSearchContent(text) ? "" : text;
  } catch {
    return "";
  }
}

export async function fetchDuckDuckGoMarkdown(searchQuery: string): Promise<string> {
  const liteUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(searchQuery)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(liteUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        signal: AbortSignal.timeout(18000),
        cache: "no-store",
      });
      if (res.ok) {
        const html = await res.text();
        if (html.length > 400 && (html.includes("uddg=") || /PLID\d+/i.test(html))) {
          return html;
        }
      }
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  }

  return fetchPageMarkdown(liteUrl);
}
