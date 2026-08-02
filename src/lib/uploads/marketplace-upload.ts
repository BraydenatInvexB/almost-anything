import { createServiceClient } from "@/lib/supabase/admin";
import { applyWhiteBackground } from "@/lib/product-images/white-background";
import type { WhiteBackgroundOptions } from "@/lib/product-images/white-background";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_DOCS = new Set([
  ...ALLOWED_IMAGES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function extForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "application/pdf") return "pdf";
  if (type.includes("wordprocessingml")) return "docx";
  if (type === "application/msword") return "doc";
  return "jpg";
}

export async function uploadMarketplaceFile(
  file: File,
  folder: "products" | "sellers" | "seller-docs",
  prefix: string,
  options?: { whiteBackground?: WhiteBackgroundOptions },
): Promise<{ url: string; fileName: string }> {
  const allowed = folder === "seller-docs" ? ALLOWED_DOCS : ALLOWED_IMAGES;
  if (!allowed.has(file.type)) {
    throw new Error(folder === "seller-docs" ? "Unsupported document type." : "Use JPG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 5 MB.");
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const isProductImage = folder === "products" && ALLOWED_IMAGES.has(file.type);

  let uploadBytes: Buffer = raw;
  let contentType = file.type;
  let extension = extForType(file.type);

  if (isProductImage) {
    const prepared = await applyWhiteBackground(raw, options?.whiteBackground);
    uploadBytes = Buffer.from(prepared.bytes);
    contentType = prepared.contentType;
    extension = "jpg";
  }

  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const objectPath = `${folder}/${filename}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage.from("product-images").upload(objectPath, uploadBytes, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  return { url: data.publicUrl, fileName: file.name };
}

export async function uploadProductImage(
  file: File,
  options?: WhiteBackgroundOptions,
): Promise<string> {
  const result = await uploadMarketplaceFile(file, "products", "product", {
    whiteBackground: options,
  });
  return result.url;
}

export async function uploadProductImageFromUrl(
  url: string,
  options?: WhiteBackgroundOptions,
): Promise<string> {
  const { prepareProductImageFromUrl } = await import("@/lib/product-images/prepare-from-url");
  const prepared = await prepareProductImageFromUrl(url, options);

  const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const objectPath = `products/${filename}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage.from("product-images").upload(objectPath, prepared.bytes, {
    contentType: prepared.contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  return data.publicUrl;
}
