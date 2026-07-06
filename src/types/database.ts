export type {
  Json,
  OrderStatus,
  ProductCategory,
  QuoteTier,
  SourcingStatus,
  StaffRole,
  StaffStatus,
  TicketPriority,
  TicketStatus,
} from "@/types/database-primitives";

import type { DatabaseAdminTables } from "@/types/database-schema-admin";
import type { DatabaseCommerceTables } from "@/types/database-schema-commerce";
import type { DatabaseProductsTables } from "@/types/database-schema-products";

import type { DatabaseSellerTables } from "@/types/database-schema-sellers";

export type Database = {
  public: {
    Tables: {
      products: DatabaseProductsTables["products"];
      customer_requests: DatabaseProductsTables["customer_requests"];
      quote_options: DatabaseProductsTables["quote_options"];
      sourced_listings: DatabaseProductsTables["sourced_listings"];
      newsletter_subscribers: DatabaseProductsTables["newsletter_subscribers"];
      api_audit_log: DatabaseCommerceTables["api_audit_log"];
      orders: DatabaseCommerceTables["orders"];
      order_items: DatabaseCommerceTables["order_items"];
      customer_addresses: DatabaseCommerceTables["customer_addresses"];
      customer_payment_methods: DatabaseCommerceTables["customer_payment_methods"];
      promo_codes: DatabaseCommerceTables["promo_codes"];
      sellers: DatabaseSellerTables["sellers"];
      seller_documents: DatabaseSellerTables["seller_documents"];
      seller_team_members: DatabaseSellerTables["seller_team_members"];
      seller_payouts: DatabaseSellerTables["seller_payouts"];
      seller_stock_imports: DatabaseSellerTables["seller_stock_imports"];
      seller_messages: DatabaseSellerTables["seller_messages"];
      staff_members: DatabaseAdminTables["staff_members"];
      platform_settings: DatabaseAdminTables["platform_settings"];
      support_tickets: DatabaseAdminTables["support_tickets"];
      ticket_messages: DatabaseAdminTables["ticket_messages"];
      staff_activity_log: DatabaseAdminTables["staff_activity_log"];
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type CustomerRequest =
  Database["public"]["Tables"]["customer_requests"]["Row"];
export type QuoteOption = Database["public"]["Tables"]["quote_options"]["Row"];
export type SourcedListing =
  Database["public"]["Tables"]["sourced_listings"]["Row"];
export type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];
export type PlatformSettings =
  Database["public"]["Tables"]["platform_settings"]["Row"];
export type SupportTicket =
  Database["public"]["Tables"]["support_tickets"]["Row"];
export type TicketMessage =
  Database["public"]["Tables"]["ticket_messages"]["Row"];
export type StaffActivity =
  Database["public"]["Tables"]["staff_activity_log"]["Row"];
