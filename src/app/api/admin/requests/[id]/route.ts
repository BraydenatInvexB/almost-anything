import { NextResponse } from "next/server";

/** Item requests are retired from the admin console. */
export async function GET() {
  return NextResponse.json({ error: "Item requests have been removed." }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Item requests have been removed." }, { status: 410 });
}
