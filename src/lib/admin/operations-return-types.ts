export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected";

export type ReturnReasonCode =
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "changed_mind"
  | "defective"
  | "other";

export type ReturnMethod = "drop_off" | "courier_pickup" | "mail_in";

export interface ReturnLineItem {
  orderItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  returnQuantity: number;
}

export interface ReturnNote {
  id: string;
  body: string;
  authorName: string;
  authorType: "staff" | "system" | "customer";
  isInternal: boolean;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  reasonCode: ReturnReasonCode;
  reason: string;
  items: ReturnLineItem[];
  method: ReturnMethod;
  status: ReturnStatus;
  refundAmount: number;
  currency: string;
  restockItems: boolean;
  assignedTo?: string;
  ticketId?: string;
  rejectionReason?: string;
  notes: ReturnNote[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  resolvedAt?: string;
}
