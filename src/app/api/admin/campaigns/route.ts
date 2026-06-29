import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import {
  createCampaign,
  deleteCampaign,
  listCampaigns,
  updateCampaign,
} from "@/lib/admin/operations-persistence";

const createSchema = z.object({
  name: z.string().min(2),
  channel: z.enum(["email", "banner", "push", "sms", "multi"]),
  status: z.enum(["draft", "scheduled", "live", "ended"]),
  promoCode: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  audience: z.string().min(2),
  startsAt: z.string(),
  endsAt: z.string().optional(),
});

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ campaigns: await listCampaigns() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const campaign = await createCampaign(parsed.data);
  return NextResponse.json({ ok: true, campaign });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const campaign = await updateCampaign(body.id, body);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, campaign });
}

export async function DELETE(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteCampaign(id);
  return NextResponse.json({ ok: true });
}
