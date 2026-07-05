export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductCategory =
  | "electronics"
  | "computers"
  | "phones"
  | "audio"
  | "home"
  | "kitchen"
  | "furniture"
  | "fashion"
  | "sleepwear"
  | "womens"
  | "mens"
  | "lingerie"
  | "jewelry"
  | "appliances"
  | "beauty"
  | "sports"
  | "toys"
  | "gaming"
  | "garden"
  | "pets"
  | "books"
  | "travel"
  | "automotive"
  | "health"
  | "baby"
  | "office"
  | "general";

export type QuoteTier = "cheapest" | "fastest" | "best_quality";

export type StaffRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "support_agent"
  | "marketing"
  | "fulfillment"
  | "finance"
  | "hr"
  | "analyst";

export type StaffStatus = "invited" | "active" | "suspended";

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type OrderStatus =
  | "pending"
  | "paid"
  | "sourcing"
  | "purchased"
  | "shipped"
  | "delivered"
  | "cancelled";

export type SourcingStatus =
  | "pending"
  | "searching"
  | "found"
  | "quoted"
  | "purchased"
  | "shipped"
  | "delivered"
  | "failed";
