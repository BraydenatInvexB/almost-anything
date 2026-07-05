export type ItemRequestStatus =
  | "pending"
  | "searching"
  | "found"
  | "quoted"
  | "purchased"
  | "shipped"
  | "delivered"
  | "failed";

export type ItemRequestUrgency = "standard" | "express" | "flexible";

export interface CustomerItemRequest {
  id: string;
  requestNumber: string;
  query: string;
  customerEmail?: string;
  budget?: number;
  currency: string;
  urgency: ItemRequestUrgency;
  status: ItemRequestStatus;
  assignedTo?: string;
  assignedToName?: string;
  internalNotes?: string;
  quotedAmount?: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}
