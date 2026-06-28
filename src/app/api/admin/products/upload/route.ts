import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extForType(file.type)}`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (isSupabaseConfigured() && serviceKey && !serviceKey.includes("your-service")) {
    try {
      const supabase = createServiceClient();
      const objectPath = `products/${filename}`;
      const { error } = await supabase.storage.from("product-images").upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
        return NextResponse.json({ ok: true, url: data.publicUrl });
      }
    } catch {
      /* fall through to local storage */
    }
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return NextResponse.json({ ok: true, url: `/uploads/products/${filename}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
