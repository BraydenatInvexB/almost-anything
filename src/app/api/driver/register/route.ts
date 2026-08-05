import { NextResponse } from "next/server";
import { z } from "zod";
import { SA_PROVINCES } from "@/config/provinces";
import { createClient } from "@/lib/supabase/server";
import { registerDriver } from "@/services/delivery/drivers";
import { createDriverCompliance } from "@/services/delivery/compliance";
import { getPublicStorefrontConfig } from "@/services/storefront-settings-service";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(40),
  province: z.enum(SA_PROVINCES as unknown as [string, ...string[]]),
  vehicleNotes: z.string().min(2).max(240),
  licenceNumber: z.string().min(3).max(80),
  licenceExpiry: z.string().date(),
  bankName: z.string().min(2).max(100),
  accountHolder: z.string().min(2).max(120),
  accountNumber: z.string().min(5).max(30),
  branchCode: z.string().min(4).max(12),
  accountType: z.enum(["cheque", "savings", "transmission"]),
});

export async function POST(request: Request) {
  const config = await getPublicStorefrontConfig();
  if (config.driverPortalEnabled === false) {
    return NextResponse.json({ error: "Driver applications are currently closed." }, { status: 403 });
  }
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")));
  const licenceFile = form.get("licenceFile");
  const bankProofFile = form.get("bankProofFile");
  if (!parsed.success || !(licenceFile instanceof File) || !(bankProofFile instanceof File)) {
    return NextResponse.json({ error: "Complete every field and upload both required documents." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (user?.email?.toLowerCase() === parsed.data.email.trim().toLowerCase()) userId = user.id;
  } catch { /* optional link */ }

  const result = await registerDriver({
    email: parsed.data.email,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    province: parsed.data.province,
    vehicleNotes: parsed.data.vehicleNotes,
    userId,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  try {
    await createDriverCompliance({
      driverId: result.driver.id,
      licenceNumber: parsed.data.licenceNumber,
      licenceExpiry: parsed.data.licenceExpiry,
      bankName: parsed.data.bankName,
      accountHolder: parsed.data.accountHolder,
      accountNumber: parsed.data.accountNumber,
      branchCode: parsed.data.branchCode,
      accountType: parsed.data.accountType,
      licenceFile,
      bankProofFile,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not upload documents." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, driverId: result.driver.id });
}
