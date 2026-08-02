import "server-only";

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  DELIVERY_MODE_LABELS,
  DELIVERY_STATUS_LABELS,
  type DeliveryFulfillmentMode,
  type DeliveryJobStatus,
  type DriverProfile,
} from "@/lib/delivery/types";
import {
  getDeliverySizeInfo,
  parseDeliverySize,
  type DeliverySize,
} from "@/lib/delivery/size";

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
  createdAt: string;
  deliveredAt: string | null;
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
    createdAt: String(row.created_at),
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
  };
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
    return data.map((row) => mapJob(row as unknown as Record<string, unknown>));
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
    return mapJob(data as unknown as Record<string, unknown>);
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

  return updateDeliveryJobStatus(jobId, "assigned", { driverId: driver.id });
}

export async function updateDeliveryJobStatus(
  jobId: string,
  status: DeliveryJobStatus,
  extra?: { driverId?: string | null },
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
    } = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (extra?.driverId !== undefined) {
      patch.driver_id = extra.driverId;
      if (extra.driverId) patch.assigned_at = new Date().toISOString();
    }
    if (status === "delivered") patch.delivered_at = new Date().toISOString();

    const { error } = await supabase.from("delivery_jobs").update(patch).eq("id", jobId);
    if (error) return { error: error.message };

    if (status === "delivered") {
      const { data: job } = await supabase
        .from("delivery_jobs")
        .select("order_id")
        .eq("id", jobId)
        .maybeSingle();
      if (job?.order_id) {
        await supabase.from("orders").update({ status: "delivered" }).eq("id", job.order_id);
      }
    }

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}
