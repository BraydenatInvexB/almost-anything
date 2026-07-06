import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSeller } from "@/services/seller-service";
import { importSellerStockCsv } from "@/services/seller/products";
import { sellerCan } from "@/config/seller-rbac";

const schema = z.object({
  csv: z.string().min(1),
  fileName: z.string().default("import.csv"),
});

export async function POST(request: Request) {
  const seller = await getCurrentSeller();
  if (!seller || !sellerCan(seller, "inventory.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import payload" }, { status: 400 });
  }

  try {
    const result = await importSellerStockCsv(seller, parsed.data.csv, parsed.data.fileName);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 400 },
    );
  }
}
