import { NextResponse } from "next/server";
import { recordPageVisit } from "@/lib/admin/operations-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ path: "/" }));
  const path = typeof body.path === "string" ? body.path : "/";
  recordPageVisit(path);
  return NextResponse.json({ ok: true });
}
