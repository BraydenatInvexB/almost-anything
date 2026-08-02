import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  applyWhiteBackground,
  parseWhiteBackgroundFlag,
  type WhiteBackgroundResult,
} from "@/lib/product-images/white-background";
import { prepareProductImageFromUrl } from "@/lib/product-images/prepare-from-url";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function storePrepared(prepared: WhiteBackgroundResult) {
  const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (isSupabaseConfigured() && serviceKey && !serviceKey.includes("your-service")) {
    try {
      const supabase = createServiceClient();
      const objectPath = `products/${filename}`;
      const { error } = await supabase.storage.from("product-images").upload(objectPath, prepared.bytes, {
        contentType: prepared.contentType,
        upsert: false,
      });

      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
        return { url: data.publicUrl, method: prepared.method };
      }
    } catch {
      /* fall through to local storage */
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), prepared.bytes);
  return { url: `/uploads/products/${filename}`, method: prepared.method };
}

function whiteBgOptions(flag: boolean) {
  return { enabled: flag, skipIfAlreadyWhite: true };
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.edit")) {
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
      const prepared = await prepareProductImageFromUrl(url, whiteBgOptions(enabled));
      const stored = await storePrepared(prepared);
      return NextResponse.json({ ok: true, ...stored });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const enabled = parseWhiteBackgroundFlag(formData.get("whiteBackground"), true);

    const remoteUrl = formData.get("url");
    if (typeof remoteUrl === "string" && remoteUrl.trim()) {
      const prepared = await prepareProductImageFromUrl(remoteUrl.trim(), whiteBgOptions(enabled));
      const stored = await storePrepared(prepared);
      return NextResponse.json({ ok: true, ...stored });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
    }

    const prepared = await applyWhiteBackground(
      Buffer.from(await file.arrayBuffer()),
      whiteBgOptions(enabled),
    );
    const stored = await storePrepared(prepared);
    return NextResponse.json({ ok: true, ...stored });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
