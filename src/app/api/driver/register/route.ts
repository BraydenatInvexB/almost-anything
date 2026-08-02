import { NextResponse } from "next/server";
import { z } from "zod";
import { SA_PROVINCES } from "@/config/provinces";
import { createClient } from "@/lib/supabase/server";
import { registerDriver } from "@/services/delivery/drivers";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  province: z.enum(SA_PROVINCES as unknown as [string, ...string[]]),
  vehicleNotes: z.string().max(240).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (user?.email?.toLowerCase() === parsed.data.email.trim().toLowerCase()) {
      userId = user.id;
    }
  } catch {
    /* optional link */
  }

  const result = await registerDriver({
    ...parsed.data,
    userId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, driverId: result.driver.id });
}
