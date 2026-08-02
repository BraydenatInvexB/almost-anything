import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import {
  anthropicConfigured,
  openaiConfigured,
} from "@/lib/sourcing/llm-client";

const DETECT_PROMPT = `You are checking a product catalog photo.
Is the background already a clean solid white (or near-white studio) backdrop?
Answer JSON only: { "alreadyWhite": boolean, "confidence": number }
alreadyWhite=true only if the backdrop behind the product is essentially white/off-white with no busy scene, gradients, props, or coloured walls.
confidence is 0-1.`;

function parseAlreadyWhite(text: string): boolean | null {
  try {
    const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fenced?.[1]?.trim() ?? text.trim();
    const json = JSON.parse(raw) as { alreadyWhite?: unknown; confidence?: unknown };
    if (typeof json.alreadyWhite !== "boolean") return null;
    const confidence = typeof json.confidence === "number" ? json.confidence : 0.7;
    return json.alreadyWhite && confidence >= 0.65;
  } catch {
    return null;
  }
}

function toDataUrl(bytes: Buffer, mime = "image/jpeg"): string {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function shrinkForVision(input: Buffer): Promise<{ bytes: Buffer; mime: string }> {
  const sharp = (await import("sharp")).default;
  const bytes = await sharp(input)
    .rotate()
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
  return { bytes, mime: "image/jpeg" };
}

async function openaiDetect(input: Buffer): Promise<boolean | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const { bytes, mime } = await shrinkForVision(input);
  const model = process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DETECT_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Does this product photo already have a white background?" },
            { type: "image_url", image_url: { url: toDataUrl(bytes, mime), detail: "low" } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseAlreadyWhite(data.choices?.[0]?.message?.content ?? "");
}

async function anthropicDetect(input: Buffer): Promise<boolean | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const { bytes, mime } = await shrinkForVision(input);
  const client = new Anthropic({ apiKey: key });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 200,
      temperature: 0,
      system: `${DETECT_PROMPT} Respond with valid JSON only.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mime as "image/jpeg",
                data: bytes.toString("base64"),
              },
            },
            {
              type: "text",
              text: "Does this product photo already have a white background?",
            },
          ],
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return parseAlreadyWhite(text);
  } catch {
    return null;
  }
}

/**
 * Vision check via OpenAI / Claude — true when the backdrop is already white.
 * Returns null when no provider is available or the call fails.
 */
export async function detectAlreadyWhiteBackground(input: Buffer): Promise<boolean | null> {
  const prefer = process.env.LLM_PROVIDER ?? "auto";
  const order =
    prefer === "anthropic"
      ? (["anthropic", "openai"] as const)
      : (["openai", "anthropic"] as const);

  for (const provider of order) {
    if (provider === "openai" && !openaiConfigured()) continue;
    if (provider === "anthropic" && !anthropicConfigured()) continue;
    const result =
      provider === "openai" ? await openaiDetect(input) : await anthropicDetect(input);
    if (result !== null) return result;
  }

  return null;
}
