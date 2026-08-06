import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import {
  createCampaign,
  deleteCampaign,
  listCampaigns,
  updateCampaign,
} from "@/lib/admin/operations-persistence";
import { toPromotionSlug } from "@/lib/marketing/storefront-promotions";

const campaignFields = z.object({
  name: z.string().min(2),
  channel: z.enum(["email", "banner", "push", "sms", "multi"]),
  status: z.enum(["draft", "scheduled", "live", "ended"]),
  promoCode: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  audience: z.string().min(2),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  storefrontEnabled: z.boolean().default(false),
  storefrontLabel: z.string().trim().min(2).max(28).optional(),
  storefrontSlug: z.string().trim().max(60).optional(),
  storefrontProductSlugs: z.array(z.string().trim().min(1)).max(100).default([]),
  storefrontOrder: z.number().int().min(0).max(100).default(0),
});

const createSchema = campaignFields.superRefine((campaign, context) => {
  if (!campaign.storefrontEnabled) return;
  if (!campaign.storefrontLabel) {
    context.addIssue({
      code: "custom",
      path: ["storefrontLabel"],
      message: "A storefront tab label is required",
    });
  }
  if (campaign.storefrontProductSlugs.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["storefrontProductSlugs"],
      message: "Select at least one product",
    });
  }
  if (!campaign.endsAt || Date.parse(campaign.endsAt) <= Date.parse(campaign.startsAt)) {
    context.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "The end date must be after the start date",
    });
  }
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  channel: z.enum(["email", "banner", "push", "sms", "multi"]).optional(),
  status: z.enum(["draft", "scheduled", "live", "ended"]).optional(),
  promoCode: z.string().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  audience: z.string().min(2).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  storefrontEnabled: z.boolean().optional(),
  storefrontLabel: z.string().trim().min(2).max(28).optional(),
  storefrontSlug: z.string().trim().max(60).optional(),
  storefrontProductSlugs: z.array(z.string().trim().min(1)).max(100).optional(),
  storefrontOrder: z.number().int().min(0).max(100).optional(),
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
  const input = parsed.data.storefrontEnabled
    ? {
        ...parsed.data,
        storefrontSlug: toPromotionSlug(
          parsed.data.storefrontLabel ?? parsed.data.name,
        ),
      }
    : parsed.data;
  if (input.storefrontEnabled) {
    if (!input.storefrontSlug) {
      return NextResponse.json({ error: "Use a tab label with letters or numbers" }, { status: 400 });
    }
    const duplicate = (await listCampaigns()).some(
      (campaign) => campaign.storefrontSlug === input.storefrontSlug,
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "A storefront event already uses this tab label" },
        { status: 409 },
      );
    }
  }
  const campaign = await createCampaign(input);
  return NextResponse.json({ ok: true, campaign });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { id, ...patch } = parsed.data;
  const normalizedPatch = patch.storefrontLabel
    ? { ...patch, storefrontSlug: toPromotionSlug(patch.storefrontLabel) }
    : patch;
  const campaigns = await listCampaigns();
  const existing = campaigns.find((campaign) => campaign.id === id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const candidate = { ...existing, ...normalizedPatch };
  if (candidate.storefrontEnabled) {
    if (!candidate.storefrontLabel || !candidate.storefrontSlug) {
      return NextResponse.json({ error: "A valid storefront tab label is required" }, { status: 400 });
    }
    if (candidate.storefrontProductSlugs.length === 0) {
      return NextResponse.json({ error: "Select at least one product" }, { status: 400 });
    }
    if (!candidate.endsAt || Date.parse(candidate.endsAt) <= Date.parse(candidate.startsAt)) {
      return NextResponse.json(
        { error: "The event end date must be after its start date" },
        { status: 400 },
      );
    }
    const duplicate = campaigns.some(
      (campaign) =>
        campaign.id !== id && campaign.storefrontSlug === candidate.storefrontSlug,
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "A storefront event already uses this tab label" },
        { status: 409 },
      );
    }
  }
  const campaign = await updateCampaign(id, normalizedPatch);
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
