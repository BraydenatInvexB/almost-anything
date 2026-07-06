import { z } from "zod";

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone number required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required").default("US"),
});

export const cartItemSchema = z.object({
  id: z.string(),
  type: z.enum(["product", "quote"]),
  productId: z.string().optional(),
  slug: z.string().optional(),
  name: z.string(),
  price: z.number().positive(),
  currency: z.string().default("ZAR"),
  imageUrl: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
  selectedOptions: z.record(z.string(), z.string()).optional(),
  quoteOptionId: z.string().optional(),
  quoteRequestId: z.string().optional(),
  tier: z.string().optional(),
  supplierName: z.string().optional(),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["card", "eft", "demo"]).default("demo"),
  courierId: z.string().optional(),
  courierName: z.string().optional(),
  shippingInternalCost: z.number().min(0).optional(),
  customerShippingCharge: z.number().min(0).optional(),
  promoCode: z.string().min(2).max(40).optional(),
  saveAddress: z.boolean().optional().default(true),
});

export const sourcingRequestSchema = z.object({
  query: z.string().min(3).max(500),
  email: z.string().email().optional(),
  budget: z.number().positive().optional(),
  urgency: z.enum(["standard", "express", "flexible"]).optional(),
});
