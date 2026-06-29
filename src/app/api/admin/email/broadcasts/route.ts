import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, listCustomers } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import type { EmailAudience } from "@/lib/admin/operations-types";
import {
  createEmailBroadcast,
  listEmailBroadcasts,
  listEmailSubscribers,
} from "@/lib/admin/operations-persistence";

const schema = z.object({
  subject: z.string().min(2).max(200),
  previewText: z.string().max(240).optional(),
  body: z.string().min(5).max(10000),
  audience: z.enum(["all", "subscribers", "customers", "vip", "active_customers"]),
  send: z.boolean().default(false),
  createdBy: z.string().min(1),
});

async function countAudience(audience: EmailAudience, customers: Awaited<ReturnType<typeof listCustomers>>) {
  const emails = new Set<string>();
  const add = (email?: string | null) => {
    if (email) emails.add(email.toLowerCase());
  };

  const subscribers = (await listEmailSubscribers()).filter((s) => s.status === "active");

  if (audience === "subscribers" || audience === "all") {
    subscribers.forEach((s) => add(s.email));
  }
  if (audience === "customers" || audience === "all" || audience === "active_customers") {
    customers.forEach((c) => add(c.email));
  }
  if (audience === "vip") {
    customers.filter((c) => c.status === "vip").forEach((c) => add(c.email));
  }
  if (audience === "active_customers") {
    customers.filter((c) => c.last_order_at).forEach((c) => add(c.email));
  }

  return emails.size;
}

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ broadcasts: await listEmailBroadcasts() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const customers = await listCustomers();
  const recipientCount = parsed.data.send ? await countAudience(parsed.data.audience, customers) : 0;

  const broadcast = await createEmailBroadcast({
    subject: parsed.data.subject,
    previewText: parsed.data.previewText,
    body: parsed.data.body,
    audience: parsed.data.audience,
    createdBy: parsed.data.createdBy,
    status: parsed.data.send ? "sent" : "draft",
    recipientCount,
    sentAt: parsed.data.send ? new Date().toISOString() : undefined,
  });

  return NextResponse.json({ ok: true, broadcast });
}
