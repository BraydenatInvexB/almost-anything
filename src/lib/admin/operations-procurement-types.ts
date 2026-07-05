import type { StockOrigin } from "@/lib/admin/operations-inventory-types";

export type ProcurementStatus =
  | "pending"
  | "ordered"
  | "in_transit"
  | "received"
  | "cancelled";

export interface ProcurementRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId?: string;
  productName: string;
  quantity: number;
  supplier: string;
  supplierCountry: string;
  supplierOrderRef?: string;
  inboundTracking?: string;
  costPrice: number;
  actualCostPaid?: number;
  sellPrice: number;
  currency: string;
  status: ProcurementStatus;
  origin: StockOrigin;
  orderedAt?: string;
  expectedAt?: string;
  receivedAt?: string;
  notes?: string;
}
