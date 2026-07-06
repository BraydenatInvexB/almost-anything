import { z } from "zod";

export const initializePaymentSchema = z.object({
  purpose: z.enum(["checkout", "seller_subscription"]),
  orderNumber: z.string().optional(),
  sellerId: z.string().uuid().optional(),
  paymentMethod: z.enum(["card", "eft"]).optional(),
  saveCard: z.boolean().optional(),
  savedPaymentMethodId: z.string().uuid().optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().min(8),
});
