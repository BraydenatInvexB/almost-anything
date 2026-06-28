import { NextResponse } from "next/server";
import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { getItemRequest, updateItemRequest } from "@/lib/admin/operations-store";
import type { ItemRequestStatus } from "@/lib/admin/operations-types";

const STATUSES: ItemRequestStatus[] = [
  "pending",
  "searching",
  "found",
  "quoted",
  "purchased",
  "shipped",
  "delivered",
  "failed",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const request = getItemRequest(id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ request });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = getItemRequest(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const patch: Parameters<typeof updateItemRequest>[1] = {};

  if (body.status && STATUSES.includes(body.status)) {
    patch.status = body.status;
  }

  if (body.assignedTo !== undefined) {
    if (body.assignedTo === null || body.assignedTo === "") {
      patch.assignedTo = undefined;
      patch.assignedToName = undefined;
    } else {
      const agents = await listStaff();
      const agent = agents.find((a) => a.id === body.assignedTo);
      patch.assignedTo = body.assignedTo;
      patch.assignedToName = agent?.full_name;
    }
  }

  if (typeof body.internalNotes === "string") {
    patch.internalNotes = body.internalNotes;
  }

  if (body.quotedAmount !== undefined && body.quotedAmount !== null && body.quotedAmount !== "") {
    patch.quotedAmount = Number(body.quotedAmount);
  }

  const updated = updateItemRequest(existing.id, patch);
  return NextResponse.json({ request: updated });
}
