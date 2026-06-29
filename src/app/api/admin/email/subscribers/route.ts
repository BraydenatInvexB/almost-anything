import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, listCustomers } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import {
  addEmailSubscriber,
  listEmailSubscribers,
  removeEmailSubscriber,
} from "@/lib/admin/operations-persistence";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.enum(["newsletter", "customer", "manual"]).default("manual"),
});

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscribers = await listEmailSubscribers();
  const customers = await listCustomers();

  return NextResponse.json({ subscribers, customers });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceClient();
      await supabase.from("newsletter_subscribers").upsert({
        email: parsed.data.email.toLowerCase(),
      });
    } catch {
      /* demo fallback ok */
    }
  }

  const subscriber = await addEmailSubscriber({
    email: parsed.data.email,
    name: parsed.data.name,
    source: parsed.data.source,
    status: "active",
  });

  return NextResponse.json({ ok: true, subscriber });
}

export async function DELETE(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await removeEmailSubscriber(id);
  return NextResponse.json({ ok: true });
}
