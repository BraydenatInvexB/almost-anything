import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDriver } from "@/services/delivery/drivers";
import { getDriverCompliance } from "@/services/delivery/compliance";
import { getDriverPayoutSummary, requestDriverPayout } from "@/services/delivery/payouts";

const schema = z.object({ amount: z.number().positive() });

export async function GET() {
  const driver = await getCurrentDriver();
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getDriverPayoutSummary(driver.id));
}

export async function POST(request: Request) {
  const driver = await getCurrentDriver();
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const compliance = await getDriverCompliance(driver.id);
  if (driver.status !== "active" || !compliance.readyForApproval) {
    return NextResponse.json({ error: "Your identity and banking details must be approved before requesting a payout." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  const result = await requestDriverPayout(driver.id, parsed.data.amount);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
