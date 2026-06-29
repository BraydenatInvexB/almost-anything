/**
 * LLM client for the discovery engine — OpenAI (fetch) + Anthropic (official SDK).
 */

import Anthropic from "@anthropic-ai/sdk";

type ChatMessage = { role: "system" | "user"; content: string };
export type LlmPreference = "openai" | "anthropic";

function anthropicClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function openaiJson(system: string, user: string): Promise<Record<string, unknown>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return {};

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ] satisfies ChatMessage[],
    }),
  });

  if (!res.ok) return {};
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  try {
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function anthropicJson(system: string, user: string): Promise<Record<string, unknown>> {
  const client = anthropicClient();
  if (!client) return {};

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.25,
      system: `${system} Respond with valid JSON only.`,
      messages: [{ role: "user", content: user }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return JSON.parse(text || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function resolvePreference(prefer?: LlmPreference): LlmPreference {
  const mode = process.env.LLM_PROVIDER ?? "auto";
  if (prefer) return prefer;
  if (mode === "anthropic") return "anthropic";
  if (mode === "openai") return "openai";
  return "anthropic";
}

/** Complete JSON with explicit provider preference and automatic fallback. */
export async function llmCompleteJson(
  system: string,
  user: string,
  prefer?: LlmPreference,
): Promise<Record<string, unknown>> {
  const primary = resolvePreference(prefer);
  const secondary: LlmPreference = primary === "anthropic" ? "openai" : "anthropic";

  const first =
    primary === "anthropic"
      ? await anthropicJson(system, user)
      : await openaiJson(system, user);
  if (Object.keys(first).length) return first;

  return secondary === "anthropic"
    ? anthropicJson(system, user)
    : openaiJson(system, user);
}

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function openaiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function activeLlmProviders(): string[] {
  const providers: string[] = [];
  if (anthropicConfigured()) providers.push("anthropic");
  if (openaiConfigured()) providers.push("openai");
  return providers;
}
