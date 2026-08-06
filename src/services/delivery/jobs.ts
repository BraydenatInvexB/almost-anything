import "server-only";

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  DELIVERY_MODE_LABELS,
  DELIVERY_STATUS_LABELS,
  type DeliveryFulfillmentMode,
  type DeliveryJobStatus,
  type DeliveryCollectionStop,
  type DriverProfile,
} from "@/lib/delivery/types";
import {
  getDeliverySizeInfo,
  parseDeliverySize,
  type DeliverySize,
} from "@/lib/delivery/size";
import type { Json } from "@/types/database";
import { resolveCollectionStopsForOrders } from "@/services/delivery/route-manifest";

export interface DeliveryJobRow {
  id: string;
  orderId: string;
  orderNumber: string;
  mode: DeliveryFulfillmentMode;
  modeLabel: string;
  status: DeliveryJobStatus;
  statusLabel: string;
  sellerId: string | null;
  driverId: string | null;
  province: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  itemSummary: string | null;
  itemCount: number;
  deliverySize: DeliverySize;
  deliverySizeLabel: string;
  vehicleHint: string;
  mayNeedTwoPeople: boolean;
  collectionStops: DeliveryCollectionStop[];
  createdAt: string;
  deliveredAt: string | null;
  proofRecipientName: string | null;
  proofSignedAt: string | null;
  proofSignaturePath: string | null;
}

function mapJob(row: Record<string, unknown>): DeliveryJobRow {
  const mode = String(row.mode) as DeliveryFulfillmentMode;
  const status = String(row.status) as DeliveryJobStatus;
  const meta =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  const deliverySize = parseDeliverySize(meta.deliverySize ?? meta.delivery_size);
  const sizeInfo = getDeliverySizeInfo(deliverySize);
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    orderNumber: String(row.order_number),
    mode,
    modeLabel: DELIVERY_MODE_LABELS[mode] ?? mode,
    status,
    statusLabel: DELIVERY_STATUS_LABELS[status] ?? status,
    sellerId: row.seller_id ? String(row.seller_id) : null,
    driverId: row.driver_id ? String(row.driver_id) : null,
    province: row.province ? String(row.province) : null,
    customerName: row.customer_name ? String(row.customer_name) : null,
    customerPhone: row.customer_phone ? String(row.customer_phone) : null,
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    addressLine1: row.address_line1 ? String(row.address_line1) : null,
    addressLine2: row.address_line2 ? String(row.address_line2) : null,
    city: row.city ? String(row.city) : null,
    postalCode: row.postal_code ? String(row.postal_code) : null,
    itemSummary: row.item_summary ? String(row.item_summary) : null,
    itemCount: Number(row.item_count ?? 1),
    deliverySize,
    deliverySizeLabel:
      typeof meta.deliverySizeLabel === "string" ? meta.deliverySizeLabel : sizeInfo.label,
    vehicleHint: typeof meta.vehicleHint === "string" ? meta.vehicleHint : sizeInfo.vehicleHint,
    mayNeedTwoPeople:
      typeof meta.mayNeedTwoPeople === "boolean"
        ? meta.mayNeedTwoPeople
        : sizeInfo.mayNeedTwoPeople,
    collectionStops: parseCollectionStops(meta.collectionStops),
    createdAt: String(row.created_at),
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
    proofRecipientName: typeof meta.proofRecipientName === "string" ? meta.proofRecipientName : null,
    proofSignedAt: typeof meta.proofSignedAt === "string" ? meta.proofSignedAt : null,
    proofSignaturePath: typeof meta.proofSignaturePath === "string" ? meta.proofSignaturePath : null,
  };
}

function parseCollectionStops(value: unknown): DeliveryCollectionStop[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const items = Array.isArray(row.items)
      ? row.items.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const parsed = item as Record<string, unknown>;
          const name = typeof parsed.name === "string" ? parsed.name : "Item";
          return [{ name, quantity: Math.max(1, Number(parsed.quantity) || 1) }];
        })
      : [];
    return [
      {
        id: typeof row.id === "string" ? row.id : `collection-${index}`,
        sellerId: typeof row.sellerId === "string" ? row.sellerId : null,
        kind: row.kind === "platform" ? "platform" : "seller",
        shopName: typeof row.shopName === "string" ? row.shopName : "Store collection",
        contactName: nullableString(row.contactName),
        contactPhone: nullableString(row.contactPhone),
        contactEmail: nullableString(row.contactEmail),
        addressLine1: nullableString(row.addressLine1),
        addressLine2: nullableString(row.addressLine2),
        city: nullableString(row.city),
        province: nullableString(row.province),
        postalCode: nullableString(row.postalCode),
        country: nullableString(row.country),
        items,
      },
    ];
  });
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function hydrateCollectionStops(jobs: DeliveryJobRow[]): Promise<DeliveryJobRow[]> {
  const missingOrderIds = jobs
    .filter((job) => job.collectionStops.length === 0)
    .map((job) => job.orderId);
  if (!missingOrderIds.length) return jobs;
  try {
    const supabase = createServiceClient();
    const stopsByOrder = await resolveCollectionStopsForOrders(supabase, missingOrderIds);
    return jobs.map((job) =>
      job.collectionStops.length
        ? job
        : { ...job, collectionStops: stopsByOrder.get(job.orderId) ?? [] },
    );
  } catch {
    return jobs;
  }
}

export async function listDeliveryJobs(filters?: {
  mode?: DeliveryFulfillmentMode;
  status?: DeliveryJobStatus;
  province?: string;
  sellerId?: string;
  driverId?: string;
  limit?: number;
}): Promise<DeliveryJobRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServiceClient();
    let q = supabase
      .from("delivery_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 100);

    if (filters?.mode) q = q.eq("mode", filters.mode);
    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.province) q = q.eq("province", filters.province);
    if (filters?.sellerId) q = q.eq("seller_id", filters.sellerId);
    if (filters?.driverId) q = q.eq("driver_id", filters.driverId);

    const { data, error } = await q;
    if (error || !data) return [];
    return hydrateCollectionStops(
      data.map((row) => mapJob(row as unknown as Record<string, unknown>)),
    );
  } catch {
    return [];
  }
}

/** Open province queue + jobs already assigned to this driver. */
export async function listJobsForDriver(driver: DriverProfile): Promise<{
  available: DeliveryJobRow[];
  mine: DeliveryJobRow[];
}> {
  if (!isSupabaseConfigured()) return { available: [], mine: [] };

  const [open, mine] = await Promise.all([
    listDeliveryJobs({
      mode: "platform_driver",
      status: "ready_for_driver",
      province: driver.province,
      limit: 50,
    }),
    listDeliveryJobs({ driverId: driver.id, limit: 50 }),
  ]);

  const activeMine = mine.filter(
    (j) => j.status !== "delivered" && j.status !== "cancelled" && j.status !== "ready_for_driver",
  );
  const history = mine.filter((j) => j.status === "delivered").slice(0, 10);

  return {
    available: open.filter((j) => !j.driverId),
    mine: [...activeMine, ...history],
  };
}

export async function getDeliveryJob(jobId: string): Promise<DeliveryJobRow | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("delivery_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!data) return null;
    const [job] = await hydrateCollectionStops([
      mapJob(data as unknown as Record<string, unknown>),
    ]);
    return job ?? null;
  } catch {
    return null;
  }
}

export async function claimDeliveryJob(
  jobId: string,
  driver: DriverProfile,
): Promise<{ ok: true } | { error: string }> {
  if (driver.status !== "active") {
    return { error: "Your driver account must be approved before claiming jobs." };
  }

  const job = await getDeliveryJob(jobId);
  if (!job) return { error: "Delivery not found" };
  if (job.mode !== "platform_driver") return { error: "This delivery is not for platform drivers" };
  if (job.status !== "ready_for_driver") return { error: "This delivery is no longer available" };
  if (job.province && job.province !== driver.province) {
    return { error: "This delivery is outside your province" };
  }

  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("delivery_jobs")
      .update({ status: "assigned", driver_id: driver.id, assigned_at: now, updated_at: now })
      .eq("id", jobId)
      .eq("status", "ready_for_driver")
      .is("driver_id", null)
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "This delivery has already been claimed." };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not claim delivery" };
  }
}

export async function updateDeliveryJobStatus(
  jobId: string,
  status: DeliveryJobStatus,
  extra?: {
    driverId?: string | null;
    proofOfDelivery?: { recipientName: string; signatureDataUrl: string };
  },
): Promise<{ ok: true } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  try {
    const supabase = createServiceClient();
    const patch: {
      status: DeliveryJobStatus;
      updated_at: string;
      driver_id?: string | null;
      assigned_at?: string;
      delivered_at?: string;
      metadata?: Json;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (extra?.driverId !== undefined) {
      patch.driver_id = extra.driverId;
      if (extra.driverId && status === "assigned") patch.assigned_at = new Date().toISOString();
    }
    if (status === "delivered") {
      const signedAt = new Date().toISOString();
      patch.delivered_at = signedAt;
      if (extra?.proofOfDelivery) {
        const bucket = "delivery-proofs";
        const encoded = extra.proofOfDelivery.signatureDataUrl.split(",")[1];
        if (!encoded) return { error: "Customer signature is invalid." };
        const signature = Buffer.from(encoded, "base64");
        if (signature.length > 180_000) return { error: "Customer signature is too large." };
        const { error: bucketError } = await supabase.storage.getBucket(bucket);
        if (bucketError) {
          const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
            public: false,
            fileSizeLimit: 200_000,
            allowedMimeTypes: ["image/png"],
          });
          if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
            return { error: "Proof-of-delivery storage is unavailable." };
          }
        }
        const signaturePath = `${jobId}/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(signaturePath, signature, {
          contentType: "image/png",
          upsert: false,
        });
        if (uploadError) return { error: "Could not save the customer signature." };
        const { data: current } = await supabase.from("delivery_jobs").select("metadata").eq("id", jobId).maybeSingle();
        const metadata = (current?.metadata as Record<string, unknown> | null) ?? {};
        patch.metadata = {
          ...metadata,
          proofRecipientName: extra.proofOfDelivery.recipientName,
          proofSignaturePath: signaturePath,
          proofSignedAt: signedAt,
        } as Json;
      }
    }

    const { error } = await supabase.from("delivery_jobs").update(patch).eq("id", jobId);
    if (error) return { error: error.message };

    if (status === "out_for_delivery" || status === "delivered") {
      const { data: job } = await supabase
        .from("delivery_jobs")
        .select("order_id")
        .eq("id", jobId)
        .maybeSingle();
      if (job?.order_id) {
        await supabase
          .from("orders")
          .update({ status: status === "delivered" ? "delivered" : "shipped" })
          .eq("id", job.order_id);
      }
    }

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}
