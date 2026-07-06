import { createServiceClient } from "@/lib/supabase/admin";

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
): Promise<{ url: string; fileName: string }> {
  const allowed = folder === "seller-docs" ? ALLOWED_DOCS : ALLOWED_IMAGES;
  if (!allowed.has(file.type)) {
    throw new Error(folder === "seller-docs" ? "Unsupported document type." : "Use JPG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extForType(file.type)}`;
  const objectPath = `${folder}/${filename}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage.from("product-images").upload(objectPath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  return { url: data.publicUrl, fileName: file.name };
}

export async function uploadProductImage(file: File): Promise<string> {
  const result = await uploadMarketplaceFile(file, "products", "product");
  return result.url;
}
