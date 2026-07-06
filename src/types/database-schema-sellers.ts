import type { Json } from "@/types/database-primitives";

export interface DatabaseSellerTables {
  sellers: {
    Row: {
      id: string;
      user_id: string | null;
      shop_name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      company_name: string;
      entity_type: string;
      registration_number: string | null;
      vat_number: string | null;
      contact_email: string;
      contact_phone: string;
      business_address: Json;
      category_slugs: string[];
      sells_all_categories: boolean;
      status: string;
      plan: string;
      subscription_status: string;
      subscription_starts_at: string | null;
      first_sale_at: string | null;
      preferred_couriers: string[];
      default_stock_origin: string;
      bank_details: Json;
      onboarding: Json;
      metadata: Json;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id?: string | null;
      shop_name: string;
      slug: string;
      description?: string | null;
      logo_url?: string | null;
      company_name: string;
      entity_type?: string;
      registration_number?: string | null;
      vat_number?: string | null;
      contact_email: string;
      contact_phone: string;
      business_address?: Json;
      category_slugs?: string[];
      sells_all_categories?: boolean;
      status?: string;
      plan?: string;
      subscription_status?: string;
      subscription_starts_at?: string | null;
      first_sale_at?: string | null;
      preferred_couriers?: string[];
      default_stock_origin?: string;
      bank_details?: Json;
      onboarding?: Json;
      metadata?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseSellerTables["sellers"]["Insert"]>;
    Relationships: [];
  };
  seller_documents: {
    Row: {
      id: string;
      seller_id: string;
      doc_type: string;
      file_name: string;
      file_url: string;
      status: string;
      notes: string | null;
      uploaded_at: string;
    };
    Insert: {
      id?: string;
      seller_id: string;
      doc_type: string;
      file_name: string;
      file_url: string;
      status?: string;
      notes?: string | null;
      uploaded_at?: string;
    };
    Update: Partial<DatabaseSellerTables["seller_documents"]["Insert"]>;
    Relationships: [];
  };
  seller_team_members: {
    Row: {
      id: string;
      seller_id: string;
      user_id: string | null;
      email: string;
      full_name: string;
      role: string;
      status: string;
      permissions: string[];
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      seller_id: string;
      user_id?: string | null;
      email: string;
      full_name: string;
      role?: string;
      status?: string;
      permissions?: string[];
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseSellerTables["seller_team_members"]["Insert"]>;
    Relationships: [];
  };
  seller_payouts: {
    Row: {
      id: string;
      seller_id: string;
      amount: number;
      currency: string;
      period_start: string | null;
      period_end: string | null;
      status: string;
      notes: string | null;
      requested_at: string;
      processed_at: string | null;
      processed_by: string | null;
    };
    Insert: {
      id?: string;
      seller_id: string;
      amount: number;
      currency?: string;
      period_start?: string | null;
      period_end?: string | null;
      status?: string;
      notes?: string | null;
      requested_at?: string;
      processed_at?: string | null;
      processed_by?: string | null;
    };
    Update: Partial<DatabaseSellerTables["seller_payouts"]["Insert"]>;
    Relationships: [];
  };
  seller_stock_imports: {
    Row: {
      id: string;
      seller_id: string;
      file_name: string;
      row_count: number;
      success_count: number;
      error_count: number;
      errors: Json;
      status: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_id: string;
      file_name: string;
      row_count?: number;
      success_count?: number;
      error_count?: number;
      errors?: Json;
      status?: string;
      created_at?: string;
    };
    Update: Partial<DatabaseSellerTables["seller_stock_imports"]["Insert"]>;
    Relationships: [];
  };
  seller_messages: {
    Row: {
      id: string;
      seller_id: string;
      sender_type: string;
      sender_name: string;
      subject: string;
      body: string;
      priority: string;
      read_at: string | null;
      metadata: Json;
      created_at: string;
    };
    Insert: {
      id?: string;
      seller_id: string;
      sender_type: string;
      sender_name: string;
      subject: string;
      body: string;
      priority?: string;
      read_at?: string | null;
      metadata?: Json;
      created_at?: string;
    };
    Update: Partial<DatabaseSellerTables["seller_messages"]["Insert"]>;
    Relationships: [];
  };
}
