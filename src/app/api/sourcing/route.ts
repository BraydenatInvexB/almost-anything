import { NextResponse } from "next/server";

/** Item requests are retired — customers shop the catalog only. */
export async function POST() {
  return NextResponse.json(
    { error: "Item requests are no longer accepted. Please browse the product catalog." },
    { status: 410 },
  );
}
