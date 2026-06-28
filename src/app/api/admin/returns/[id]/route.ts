import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import {
  addReturnNote,
  createExpense,
  getReturn,
  updateReturn,
} from "@/lib/admin/operations-store";
import { computeRefundAmount } from "@/lib/returns/returns";
import type { ReturnStatus } from "@/lib/admin/operations-types";

const RETURN_STATUSES: ReturnStatus[] = ["requested", "approved", "received", "refunded", "rejected"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ret = getReturn(id);
  if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ return: ret });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = getReturn(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const now = new Date().toISOString();

  switch (body.action) {
    case "approve": {
      updateReturn(id, { status: "approved", approvedAt: now });
      addReturnNote(id, {
        body: "Return approved — prepaid label sent to customer.",
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: true,
      });
      break;
    }
    case "reject": {
      if (!body.rejectionReason?.trim()) {
        return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
      }
      updateReturn(id, {
        status: "rejected",
        rejectionReason: body.rejectionReason.trim(),
        resolvedAt: now,
      });
      addReturnNote(id, {
        body: `Return rejected: ${body.rejectionReason.trim()}`,
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: false,
      });
      break;
    }
    case "mark_received": {
      updateReturn(id, { status: "received", receivedAt: now });
      addReturnNote(id, {
        body: existing.restockItems
          ? "Items received and queued for restock."
          : "Items received — marked as damaged/non-restockable.",
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: true,
      });
      break;
    }
    case "refund": {
      const amount =
        body.refundAmount != null ? Number(body.refundAmount) : computeRefundAmount(existing.items);
      updateReturn(id, {
        status: "refunded",
        refundAmount: amount,
        resolvedAt: now,
      });
      if (amount > 0) {
        createExpense({
          label: `Refund ${existing.rmaNumber}`,
          category: "refunds",
          amount,
          currency: existing.currency,
          orderId: existing.orderId,
          recordedBy: staff.full_name,
          notes: `RMA ${existing.rmaNumber}`,
        });
      }
      addReturnNote(id, {
        body: `Refund of ${amount.toFixed(2)} ${existing.currency} processed to original payment method.`,
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: false,
      });
      break;
    }
    case "add_note": {
      if (!body.note?.trim()) {
        return NextResponse.json({ error: "Note required" }, { status: 400 });
      }
      addReturnNote(id, {
        body: body.note.trim(),
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: Boolean(body.isInternal),
      });
      break;
    }
    case "update": {
      const patch: Parameters<typeof updateReturn>[1] = {};
      if (body.status && RETURN_STATUSES.includes(body.status)) {
        patch.status = body.status;
        if (body.status === "approved" && !existing.approvedAt) patch.approvedAt = now;
        if (body.status === "received" && !existing.receivedAt) patch.receivedAt = now;
        if ((body.status === "refunded" || body.status === "rejected") && !existing.resolvedAt) {
          patch.resolvedAt = now;
        }
        if (body.status === "refunded" && body.refundAmount != null) {
          const amount = Number(body.refundAmount);
          patch.refundAmount = amount;
          if (amount > 0 && existing.status !== "refunded") {
            createExpense({
              label: `Refund ${existing.rmaNumber}`,
              category: "refunds",
              amount,
              currency: existing.currency,
              orderId: existing.orderId,
              recordedBy: staff.full_name,
              notes: `RMA ${existing.rmaNumber}`,
            });
          }
        }
      }
      if (body.reasonCode) patch.reasonCode = body.reasonCode;
      if (body.reason?.trim()) patch.reason = body.reason.trim();
      if (body.method) patch.method = body.method;
      if (body.refundAmount != null && body.status !== "refunded") {
        patch.refundAmount = Number(body.refundAmount);
      }
      if (body.restockItems != null) patch.restockItems = Boolean(body.restockItems);
      if (body.assignedTo !== undefined) patch.assignedTo = body.assignedTo || undefined;
      if (body.rejectionReason !== undefined) patch.rejectionReason = body.rejectionReason || undefined;

      updateReturn(id, patch);
      addReturnNote(id, {
        body: "Return record updated by staff.",
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: true,
      });
      break;
    }
    case "message_customer": {
      if (!body.message?.trim()) {
        return NextResponse.json({ error: "Message required" }, { status: 400 });
      }
      addReturnNote(id, {
        body: body.message.trim(),
        authorName: staff.full_name,
        authorType: "staff",
        isInternal: false,
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, return: getReturn(id) });
}
