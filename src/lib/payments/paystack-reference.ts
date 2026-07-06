export function createPaystackReference(prefix: "CHK" | "SEL" | "SUB", id: string): string {
  const slug = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `AA-${prefix}-${slug}-${stamp}-${rand}`.toUpperCase();
}
