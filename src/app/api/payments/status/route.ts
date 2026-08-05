import { NextResponse } from "next/server";
import { hostedPaymentStatus } from "@/lib/payments/provider-fulfillment";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Reference is required." }, { status: 400 });
  try {
    return NextResponse.json(await hostedPaymentStatus(reference));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check payment." }, { status: 400 });
  }
}
