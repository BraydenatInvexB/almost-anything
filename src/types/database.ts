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
  | "beauty"
  | "sports"
  | "toys"
  | "gaming"
  | "garden"
  | "pets"
  | "books"
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

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          category: ProductCategory;
          base_price: number;
          retail_price: number;
          markup_percent: number;
          currency: string;
          rating: number;
          review_count: number;
          stock_status: "in_stock" | "available_international" | "low_stock" | "out_of_stock" | "sourced";
          image_url: string | null;
          enhanced_image_url: string | null;
          source_url: string | null;
          source_name: string | null;
          delivery_days_min: number;
          delivery_days_max: number;
          is_featured: boolean;
          is_exclusive: boolean;
          is_deal: boolean;
          deal_discount_percent: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          category?: ProductCategory;
          base_price: number;
          retail_price: number;
          markup_percent?: number;
          currency?: string;
          rating?: number;
          review_count?: number;
          stock_status?: "in_stock" | "available_international" | "low_stock" | "out_of_stock" | "sourced";
          image_url?: string | null;
          enhanced_image_url?: string | null;
          source_url?: string | null;
          source_name?: string | null;
          delivery_days_min?: number;
          delivery_days_max?: number;
          is_featured?: boolean;
          is_exclusive?: boolean;
          is_deal?: boolean;
          deal_discount_percent?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      customer_requests: {
        Row: {
          id: string;
          user_id: string | null;
          query: string;
          parsed_intent: Json | null;
          status: SourcingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          query: string;
          parsed_intent?: Json | null;
          status?: SourcingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_requests"]["Insert"]
        >;
        Relationships: [];
      };
      quote_options: {
        Row: {
          id: string;
          request_id: string;
          tier: QuoteTier;
          product_name: string;
          supplier_name: string;
          supplier_url: string | null;
          base_price: number;
          retail_price: number;
          delivery_days: number;
          quality_score: number;
          rating: number | null;
          image_url: string | null;
          enhanced_image_url: string | null;
          is_selected: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          tier: QuoteTier;
          product_name: string;
          supplier_name: string;
          supplier_url?: string | null;
          base_price: number;
          retail_price: number;
          delivery_days?: number;
          quality_score?: number;
          rating?: number | null;
          image_url?: string | null;
          enhanced_image_url?: string | null;
          is_selected?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_options"]["Insert"]>;
        Relationships: [];
      };
      sourced_listings: {
        Row: {
          id: string;
          product_id: string | null;
          supplier_name: string;
          supplier_url: string;
          raw_price: number;
          currency: string;
          availability: string | null;
          delivery_estimate: string | null;
          rating: number | null;
          review_count: number | null;
          scraped_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          supplier_name: string;
          supplier_url: string;
          raw_price: number;
          currency?: string;
          availability?: string | null;
          delivery_estimate?: string | null;
          rating?: number | null;
          review_count?: number | null;
          scraped_at?: string;
          metadata?: Json;
        };
        Update: Partial<
          Database["public"]["Tables"]["sourced_listings"]["Insert"]
        >;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
          is_active?: boolean;
        };
        Update: Partial<
          Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]
        >;
        Relationships: [];
      };
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
        Update: Partial<Database["public"]["Tables"]["api_audit_log"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      staff_members: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          full_name: string;
          role: StaffRole;
          status: StaffStatus;
          department: string | null;
          title: string | null;
          phone: string | null;
          avatar_url: string | null;
          notes: string | null;
          created_by: string | null;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
          extra_permissions?: Json;
          denied_permissions?: Json;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          full_name: string;
          role?: StaffRole;
          status?: StaffStatus;
          department?: string | null;
          title?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
          extra_permissions?: Json;
          denied_permissions?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Insert"]>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: number;
          store_name: string;
          support_email: string;
          currency: string;
          default_markup_percent: number;
          min_markup_percent: number;
          max_markup_percent: number;
          free_shipping_threshold: number;
          flat_shipping_fee: number;
          tax_rate: number;
          auto_publish_sourced: boolean;
          maintenance_mode: boolean;
          updated_by: string | null;
          updated_at: string;
          extended_config?: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["platform_settings"]["Row"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          customer_id: string | null;
          customer_email: string;
          customer_name: string | null;
          subject: string;
          category: string;
          status: TicketStatus;
          priority: TicketPriority;
          assigned_to: string | null;
          order_id: string | null;
          last_reply_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number: string;
          customer_id?: string | null;
          customer_email: string;
          customer_name?: string | null;
          subject: string;
          category?: string;
          status?: TicketStatus;
          priority?: TicketPriority;
          assigned_to?: string | null;
          order_id?: string | null;
          last_reply_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>;
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_type: "customer" | "staff" | "system";
          author_id: string | null;
          author_name: string | null;
          body: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_type: "customer" | "staff" | "system";
          author_id?: string | null;
          author_name?: string | null;
          body: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_messages"]["Insert"]>;
        Relationships: [];
      };
      staff_activity_log: {
        Row: {
          id: string;
          staff_id: string | null;
          staff_name: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id?: string | null;
          staff_name?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_activity_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

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
