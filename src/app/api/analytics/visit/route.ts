import { NextResponse } from "next/server";
import { recordPageVisit } from "@/lib/admin/operations-persistence";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ path: "/" }));
  const path = typeof body.path === "string" ? body.path : "/";
  await recordPageVisit(path);
  return NextResponse.json({ ok: true });
}
