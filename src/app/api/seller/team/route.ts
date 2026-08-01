import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import {
  ALL_SELLER_PERMISSIONS,
  type SellerPermission,
} from "@/config/seller-permissions";
import { sellerCan } from "@/config/seller-rbac";
import { SELLER_ASSIGNABLE_ROLES } from "@/config/seller-team-roles";
import {
  inviteSellerTeamMember,
  listSellerTeam,
  removeSellerTeamMember,
  updateSellerTeamMember,
} from "@/services/seller/team";

const roleEnum = z.enum(SELLER_ASSIGNABLE_ROLES);
const permissionEnum = z.enum(
  ALL_SELLER_PERMISSIONS as [SellerPermission, ...SellerPermission[]],
);

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: roleEnum.default("staff"),
  permissions: z.array(permissionEnum).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  role: roleEnum.optional(),
  status: z.enum(["invited", "active", "suspended"]).optional(),
  fullName: z.string().min(2).optional(),
  permissions: z.array(permissionEnum).optional(),
});

export async function GET() {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "team.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const team = await listSellerTeam(seller.id);
    return NextResponse.json({ team });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load team" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "team.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  try {
    const result = await inviteSellerTeamMember(seller, parsed.data, { request });
    return NextResponse.json({
      ok: true,
      member: result.member,
      emailSent: result.emailSent,
      redirectTo: result.redirectTo,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invite failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "team.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  try {
    const { id, ...updates } = parsed.data;
    const member = await updateSellerTeamMember(seller.id, id, updates);
    return NextResponse.json({ ok: true, member });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "team.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Team member id is required" }, { status: 400 });
  }

  try {
    await removeSellerTeamMember(seller.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remove failed" },
      { status: 400 },
    );
  }
}
