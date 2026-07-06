import type {
  Json,
  ProductCategory,
  QuoteTier,
  SourcingStatus,
} from "@/types/database-primitives";

export interface DatabaseProductsTables {
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
      show_in_hot: boolean;
      show_in_steals: boolean;
      show_in_fresh_drops: boolean;
      seller_id: string | null;
      listing_status: string | null;
      stock_quantity: number;
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
      show_in_hot?: boolean;
      show_in_steals?: boolean;
      show_in_fresh_drops?: boolean;
      seller_id?: string | null;
      listing_status?: string | null;
      stock_quantity?: number;
      metadata?: Json;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<DatabaseProductsTables["products"]["Insert"]>;
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
    Update: Partial<DatabaseProductsTables["customer_requests"]["Insert"]>;
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
    Update: Partial<DatabaseProductsTables["quote_options"]["Insert"]>;
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
    Update: Partial<DatabaseProductsTables["sourced_listings"]["Insert"]>;
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
    Update: Partial<DatabaseProductsTables["newsletter_subscribers"]["Insert"]>;
    Relationships: [];
  };
}
