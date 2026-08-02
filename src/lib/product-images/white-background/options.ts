import type { WhiteBackgroundOptions } from "./types";

/** Form / JSON flag parsing for upload routes. Default: on. */
export function parseWhiteBackgroundFlag(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(v)) return false;
    if (["true", "1", "on", "yes"].includes(v)) return true;
  }
  return fallback;
}

export function normalizeWhiteBackgroundOptions(
  options?: WhiteBackgroundOptions,
): Required<WhiteBackgroundOptions> {
  return {
    enabled: options?.enabled ?? true,
    skipIfAlreadyWhite: options?.skipIfAlreadyWhite ?? true,
  };
}
