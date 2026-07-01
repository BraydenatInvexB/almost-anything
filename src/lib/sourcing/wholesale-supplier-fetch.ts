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

  const jinaMarkdown = await fetchPageMarkdown(liteUrl);
  if (jinaMarkdown.length > 200 && jinaMarkdown.includes("uddg=")) {
    return jinaMarkdown;
  }

  try {
    const res = await fetch(liteUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 400 && html.includes("uddg=")) return html;
    }
  } catch {
    /* direct DDG unavailable — keep Jina output */
  }

  return jinaMarkdown;
}
