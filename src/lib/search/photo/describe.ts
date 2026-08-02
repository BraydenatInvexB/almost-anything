/**
 * Server-side: turn a search reference photo into catalog search keywords.
 * Uses vision when an LLM key is configured; otherwise returns an empty hint.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  anthropicConfigured,
  openaiConfigured,
  type LlmPreference,
} from "@/lib/sourcing/llm-client";
import type { PhotoSearchHint } from "./types";

const SYSTEM = `You help an online marketplace match a shopper's reference photo to products already listed on the site.
Return JSON only:
{
  "query": "3-8 short catalog search keywords (brand/model/type/color if visible)",
  "label": "short product name, max 8 words"
}
Prefer concrete product terms a shopper would type (e.g. "black nike air force 1 sneakers").
Do not invent SKUs. If the image is unclear, still guess the most likely product category keywords.`;

function parseHint(raw: Record<string, unknown>): PhotoSearchHint | null {
  const query = typeof raw.query === "string" ? raw.query.trim() : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : query;
  if (!query) return null;
  return { query: query.slice(0, 120), label: (label || query).slice(0, 80) };
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function splitDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match?.[1] || !match[2]) return null;
  return { mediaType: match[1], base64: match[2] };
}

async function openaiDescribe(dataUrl: string): Promise<PhotoSearchHint | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "What product is in this photo? Return search keywords for our catalog." },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseHint(parseJsonObject(data.choices?.[0]?.message?.content ?? "{}"));
}

async function anthropicDescribe(dataUrl: string): Promise<PhotoSearchHint | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const parts = splitDataUrl(dataUrl);
  if (!parts) return null;

  const client = new Anthropic({ apiKey: key });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 400,
      temperature: 0.2,
      system: `${SYSTEM} Respond with valid JSON only.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parts.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: parts.base64,
              },
            },
            {
              type: "text",
              text: "What product is in this photo? Return search keywords for our catalog.",
            },
          ],
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return parseHint(parseJsonObject(text));
  } catch {
    return null;
  }
}

function resolvePreference(prefer?: LlmPreference): LlmPreference {
  const mode = process.env.LLM_PROVIDER ?? "auto";
  if (prefer) return prefer;
  if (mode === "anthropic") return "anthropic";
  if (mode === "openai") return "openai";
  return "openai"; // vision defaults to OpenAI first when auto
}

/** Describe a shopper photo into catalog search keywords. */
export async function describeSearchPhoto(
  dataUrl: string,
  prefer?: LlmPreference,
): Promise<PhotoSearchHint | null> {
  if (!dataUrl.startsWith("data:image/")) return null;
  if (dataUrl.length > 2_000_000) return null;

  const primary = resolvePreference(prefer);
  const order: LlmPreference[] =
    primary === "openai"
      ? ["openai", "anthropic"]
      : ["anthropic", "openai"];

  for (const provider of order) {
    if (provider === "openai" && !openaiConfigured()) continue;
    if (provider === "anthropic" && !anthropicConfigured()) continue;
    const hint =
      provider === "openai"
        ? await openaiDescribe(dataUrl)
        : await anthropicDescribe(dataUrl);
    if (hint) return hint;
  }

  return null;
}
