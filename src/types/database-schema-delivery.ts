import type { Json } from "@/types/database-primitives";

export interface DatabaseDeliveryTables {
  drivers: {
    Row: {
      id: string;
      user_id: string | null;
      email: string;
      full_name: string;
      phone: string | null;
      province: string;
      status: string;
      vehicle_notes: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id?: string | null;
      email: string;
      full_name: string;
      phone?: string | null;
      province: string;
      status?: string;
      vehicle_notes?: string | null;
      notes?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseDeliveryTables["drivers"]["Insert"]>;
    Relationships: [];
  };
  delivery_jobs: {
    Row: {
      id: string;
      order_id: string;
      order_number: string;
      mode: string;
      status: string;
      seller_id: string | null;
      driver_id: string | null;
      province: string | null;
      customer_name: string | null;
      customer_phone: string | null;
      customer_email: string | null;
      address_line1: string | null;
      address_line2: string | null;
      city: string | null;
      postal_code: string | null;
      country: string | null;
      item_summary: string | null;
      item_count: number;
      notes: string | null;
      assigned_at: string | null;
      delivered_at: string | null;
      metadata: Json;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      order_number: string;
      mode: string;
      status?: string;
      seller_id?: string | null;
      driver_id?: string | null;
      province?: string | null;
      customer_name?: string | null;
      customer_phone?: string | null;
      customer_email?: string | null;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      postal_code?: string | null;
      country?: string | null;
      item_summary?: string | null;
      item_count?: number;
      notes?: string | null;
      assigned_at?: string | null;
      delivered_at?: string | null;
      metadata?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseDeliveryTables["delivery_jobs"]["Insert"]>;
    Relationships: [];
  };
}
