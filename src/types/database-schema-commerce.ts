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
      seller_id: string | null;
      seller_fulfilled: boolean;
      seller_tracking_number: string | null;
      seller_courier: string | null;
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
      seller_id?: string | null;
      seller_fulfilled?: boolean;
      seller_tracking_number?: string | null;
      seller_courier?: string | null;
      created_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["order_items"]["Insert"]>;
    Relationships: [];
  };
  customer_addresses: {
    Row: {
      id: string;
      user_id: string;
      label: string | null;
      full_name: string;
      phone: string;
      address_line1: string;
      address_line2: string | null;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      label?: string | null;
      full_name: string;
      phone: string;
      address_line1: string;
      address_line2?: string | null;
      city: string;
      state: string;
      postal_code: string;
      country?: string;
      is_default?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["customer_addresses"]["Insert"]>;
    Relationships: [];
  };
  customer_payment_methods: {
    Row: {
      id: string;
      user_id: string;
      provider: string;
      authorization_code: string;
      customer_code: string | null;
      card_type: string | null;
      last4: string;
      exp_month: string | null;
      exp_year: string | null;
      is_default: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      provider?: string;
      authorization_code: string;
      customer_code?: string | null;
      card_type?: string | null;
      last4: string;
      exp_month?: string | null;
      exp_year?: string | null;
      is_default?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["customer_payment_methods"]["Insert"]>;
    Relationships: [];
  };
  promo_codes: {
    Row: {
      id: string;
      code: string;
      label: string | null;
      status: string;
      discount_type: string;
      discount_value: number;
      scope: string;
      product_ids: string[];
      category_slugs: string[];
      min_order_amount: number | null;
      max_discount_amount: number | null;
      starts_at: string | null;
      ends_at: string | null;
      usage_limit: number | null;
      usage_count: number;
      seller_id: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      code: string;
      label?: string | null;
      status?: string;
      discount_type?: string;
      discount_value: number;
      scope?: string;
      product_ids?: string[];
      category_slugs?: string[];
      min_order_amount?: number | null;
      max_discount_amount?: number | null;
      starts_at?: string | null;
      ends_at?: string | null;
      usage_limit?: number | null;
      usage_count?: number;
      seller_id?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseCommerceTables["promo_codes"]["Insert"]>;
    Relationships: [];
  };
}
