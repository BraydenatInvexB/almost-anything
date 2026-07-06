import { z } from "zod";

export const initializePaymentSchema = z.object({
  purpose: z.enum(["checkout", "seller_signup", "seller_subscription"]),
  orderNumber: z.string().optional(),
  sellerId: z.string().uuid().optional(),
  paymentMethod: z.enum(["card", "eft"]).optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().min(8),
});
