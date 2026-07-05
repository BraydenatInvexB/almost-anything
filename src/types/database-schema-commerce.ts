import type { Json } from "@/types/database-primitives";

export interface DatabaseCommerceTables {
  api_audit_log: {
    Row: {
      id: string;
      route: string;
      method: string;
      ip_address: string | null;
      user_id: string | null;
      status_code: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      route: string;
      method: string;
      ip_address?: string | null;
      user_id?: string | null;
      status_code: number;
      created_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["api_audit_log"]["Insert"]>;
    Relationships: [];
  };
  orders: {
    Row: {
      id: string;
      order_number: string;
      user_id: string | null;
      status: string;
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
      currency: string;
      payment_method: string | null;
      payment_intent_id: string | null;
      shipping_address: Json;
      metadata: Json;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      order_number: string;
      user_id?: string | null;
      status?: string;
      subtotal: number;
      shipping?: number;
      tax?: number;
      total: number;
      currency?: string;
      payment_method?: string | null;
      payment_intent_id?: string | null;
      shipping_address: Json;
      metadata?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["orders"]["Insert"]>;
    Relationships: [];
  };
  order_items: {
    Row: {
      id: string;
      order_id: string;
      product_id: string | null;
      quote_option_id: string | null;
      item_type: string;
      name: string;
      slug: string | null;
      unit_price: number;
      quantity: number;
      image_url: string | null;
      metadata: Json;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      product_id?: string | null;
      quote_option_id?: string | null;
      item_type: string;
      name: string;
      slug?: string | null;
      unit_price: number;
      quantity?: number;
      image_url?: string | null;
      metadata?: Json;
      created_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["order_items"]["Insert"]>;
    Relationships: [];
  };
}
