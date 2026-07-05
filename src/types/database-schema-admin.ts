import type {
  Json,
  StaffRole,
  StaffStatus,
  TicketPriority,
  TicketStatus,
} from "@/types/database-primitives";

export interface DatabaseAdminTables {
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
    Update: Partial<DatabaseAdminTables["staff_members"]["Insert"]>;
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
    Insert: Partial<DatabaseAdminTables["platform_settings"]["Row"]>;
    Update: Partial<DatabaseAdminTables["platform_settings"]["Row"]>;
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
    Update: Partial<DatabaseAdminTables["support_tickets"]["Insert"]>;
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
    Update: Partial<DatabaseAdminTables["ticket_messages"]["Insert"]>;
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
    Update: Partial<DatabaseAdminTables["staff_activity_log"]["Insert"]>;
    Relationships: [];
  };
}
