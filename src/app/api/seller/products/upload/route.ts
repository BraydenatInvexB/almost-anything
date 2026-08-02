import { NextResponse } from "next/server";
import { requireApprovedSellerApi } from "@/services/seller/access-guard";
import { sellerCan } from "@/config/seller-rbac";
import { uploadProductImage, uploadProductImageFromUrl } from "@/lib/uploads/marketplace-upload";
import { parseWhiteBackgroundFlag } from "@/lib/product-images/white-background";

function whiteBgOptions(flag: boolean) {
  return { enabled: flag, skipIfAlreadyWhite: true };
}

export async function POST(request: Request) {
  const gate = await requireApprovedSellerApi();
  if (gate.error) return gate.error;
  const seller = gate.seller;
  if (!sellerCan(seller, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { url?: string; whiteBackground?: unknown };
      const url = typeof body.url === "string" ? body.url.trim() : "";
      if (!url) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
      }
      const enabled = parseWhiteBackgroundFlag(body.whiteBackground, true);
      const stored = await uploadProductImageFromUrl(url, whiteBgOptions(enabled));
      return NextResponse.json({ ok: true, url: stored });
    }

    const formData = await request.formData().catch(() => null);
    const enabled = parseWhiteBackgroundFlag(formData?.get("whiteBackground"), true);

    const remoteUrl = formData?.get("url");
    if (typeof remoteUrl === "string" && remoteUrl.trim()) {
      const stored = await uploadProductImageFromUrl(remoteUrl.trim(), whiteBgOptions(enabled));
      return NextResponse.json({ ok: true, url: stored });
    }

    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await uploadProductImage(file, whiteBgOptions(enabled));
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
