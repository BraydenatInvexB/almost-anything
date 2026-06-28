import type {
  StaffMember,
  SupportTicket,
  TicketMessage,
  StaffActivity,
  PlatformSettings,
} from "@/types/database";

/**
 * Rich demo data so the admin panel is fully explorable in local development
 * without a configured Supabase backend. In production these are replaced by
 * live queries (see admin-service.ts).
 */

function iso(daysAgo: number, hoursAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

export const DEMO_STAFF: StaffMember[] = [
  {
    id: "stf-001",
    user_id: null,
    email: "owner@almostanything.store",
    full_name: "Brayden Pillay",
    role: "super_admin",
    status: "active",
    department: "Executive",
    title: "Founder & CEO",
    phone: "+1 (555) 010-0001",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: null,
    last_active_at: iso(0, 1),
    created_at: iso(220),
    updated_at: iso(0, 1),
  },
  {
    id: "stf-002",
    user_id: null,
    email: "amara.okafor@almostanything.store",
    full_name: "Amara Okafor",
    role: "admin",
    status: "active",
    department: "Operations",
    title: "Chief Operating Officer",
    phone: "+1 (555) 010-0002",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: "stf-001",
    last_active_at: iso(0, 3),
    created_at: iso(180),
    updated_at: iso(0, 3),
  },
  {
    id: "stf-003",
    user_id: null,
    email: "diego.martin@almostanything.store",
    full_name: "Diego Martín",
    role: "manager",
    status: "active",
    department: "Operations",
    title: "Operations Manager",
    phone: "+1 (555) 010-0003",
    avatar_url: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: "stf-002",
    last_active_at: iso(0, 6),
    created_at: iso(150),
    updated_at: iso(0, 6),
  },
  {
    id: "stf-004",
    user_id: null,
    email: "priya.nair@almostanything.store",
    full_name: "Priya Nair",
    role: "support_agent",
    status: "active",
    department: "Customer Experience",
    title: "Senior Support Specialist",
    phone: "+1 (555) 010-0004",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: "stf-003",
    last_active_at: iso(0, 2),
    created_at: iso(120),
    updated_at: iso(0, 2),
  },
  {
    id: "stf-005",
    user_id: null,
    email: "leo.schmidt@almostanything.store",
    full_name: "Leo Schmidt",
    role: "marketing",
    status: "active",
    department: "Growth",
    title: "Head of Marketing",
    phone: "+1 (555) 010-0005",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: "stf-002",
    last_active_at: iso(1),
    created_at: iso(95),
    updated_at: iso(1),
  },
  {
    id: "stf-006",
    user_id: null,
    email: "fatima.zahra@almostanything.store",
    full_name: "Fatima Zahra",
    role: "fulfillment",
    status: "active",
    department: "Logistics",
    title: "Fulfillment Lead",
    phone: "+1 (555) 010-0006",
    avatar_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: "stf-003",
    last_active_at: iso(0, 9),
    created_at: iso(80),
    updated_at: iso(0, 9),
  },
  {
    id: "stf-007",
    user_id: null,
    email: "noah.kim@almostanything.store",
    full_name: "Noah Kim",
    role: "analyst",
    status: "active",
    department: "Strategy",
    title: "Business Analyst",
    phone: "+1 (555) 010-0007",
    avatar_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop&crop=face",
    notes: null,
    created_by: "stf-002",
    last_active_at: iso(2),
    created_at: iso(60),
    updated_at: iso(2),
  },
  {
    id: "stf-008",
    user_id: null,
    email: "sara.lindqvist@almostanything.store",
    full_name: "Sara Lindqvist",
    role: "support_agent",
    status: "suspended",
    department: "Customer Experience",
    title: "Support Specialist",
    phone: "+1 (555) 010-0008",
    avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&crop=face",
    notes: "On extended leave.",
    created_by: "stf-004",
    last_active_at: iso(34),
    created_at: iso(70),
    updated_at: iso(34),
  },
  {
    id: "stf-009",
    user_id: null,
    email: "thandi.mokoena@almostanything.store",
    full_name: "Thandi Mokoena",
    role: "finance",
    status: "active",
    department: "Finance",
    title: "Finance Manager",
    phone: "+27 (11) 555-0109",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face",
    notes: "Handles refunds, expenses, and supplier payments.",
    created_by: "stf-001",
    last_active_at: iso(0, 4),
    created_at: iso(45),
    updated_at: iso(0, 4),
  },
  {
    id: "stf-010",
    user_id: null,
    email: "james.vanwyk@almostanything.store",
    full_name: "James van Wyk",
    role: "hr",
    status: "active",
    department: "Human Resources",
    title: "HR Business Partner",
    phone: "+27 (11) 555-0110",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",
    notes: "Employee records, roles, and onboarding.",
    created_by: "stf-002",
    last_active_at: iso(0, 8),
    created_at: iso(40),
    updated_at: iso(0, 8),
  },
];

export const DEMO_SETTINGS: PlatformSettings = {
  id: 1,
  store_name: "Almost Anything",
  support_email: "hello@almostanything.store",
  currency: "ZAR",
  default_markup_percent: 18,
  min_markup_percent: 8,
  max_markup_percent: 45,
  free_shipping_threshold: 75,
  flat_shipping_fee: 12,
  tax_rate: 0,
  auto_publish_sourced: true,
  maintenance_mode: false,
  updated_by: "stf-001",
  updated_at: iso(3),
};

export interface DemoCustomer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  orders_count: number;
  total_spent: number;
  status: "active" | "vip" | "flagged";
  avatar_url: string | null;
  last_order_at: string | null;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { id: "cus-001", full_name: "Gabriela Christiansen", email: "gabriela@consolidated.co", phone: "+1 (555) 220-1001", created_at: iso(210), orders_count: 14, total_spent: 8420.5, status: "vip", avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face", last_order_at: iso(2) },
  { id: "cus-002", full_name: "Marcus Bennett", email: "marcus.bennett@gmail.com", phone: "+1 (555) 220-1002", created_at: iso(190), orders_count: 6, total_spent: 2310.0, status: "active", avatar_url: null, last_order_at: iso(9) },
  { id: "cus-003", full_name: "Yuki Tanaka", email: "yuki.tanaka@outlook.com", phone: "+1 (555) 220-1003", created_at: iso(160), orders_count: 9, total_spent: 4185.75, status: "vip", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face", last_order_at: iso(1) },
  { id: "cus-004", full_name: "Olivia Hughes", email: "olivia.h@proton.me", phone: null, created_at: iso(140), orders_count: 3, total_spent: 870.2, status: "active", avatar_url: null, last_order_at: iso(21) },
  { id: "cus-005", full_name: "Daniel Okonkwo", email: "d.okonkwo@gmail.com", phone: "+1 (555) 220-1005", created_at: iso(120), orders_count: 11, total_spent: 5640.0, status: "vip", avatar_url: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=120&h=120&fit=crop&crop=face", last_order_at: iso(4) },
  { id: "cus-006", full_name: "Sophie Laurent", email: "sophie.laurent@gmail.com", phone: "+1 (555) 220-1006", created_at: iso(95), orders_count: 2, total_spent: 412.99, status: "active", avatar_url: null, last_order_at: iso(30) },
  { id: "cus-007", full_name: "Ahmed Al-Rashid", email: "ahmed.r@gmail.com", phone: "+1 (555) 220-1007", created_at: iso(80), orders_count: 7, total_spent: 3120.45, status: "active", avatar_url: null, last_order_at: iso(6) },
  { id: "cus-008", full_name: "Isabella Romano", email: "isabella.romano@icloud.com", phone: "+1 (555) 220-1008", created_at: iso(60), orders_count: 1, total_spent: 149.0, status: "flagged", avatar_url: null, last_order_at: iso(45) },
  { id: "cus-009", full_name: "Liam O'Brien", email: "liam.obrien@gmail.com", phone: "+1 (555) 220-1009", created_at: iso(40), orders_count: 4, total_spent: 1890.3, status: "active", avatar_url: null, last_order_at: iso(3) },
  { id: "cus-010", full_name: "Zara Mthembu", email: "zara.m@gmail.com", phone: "+1 (555) 220-1010", created_at: iso(20), orders_count: 5, total_spent: 2240.8, status: "active", avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&h=120&fit=crop&crop=face", last_order_at: iso(1) },
];

export const DEMO_TICKETS: SupportTicket[] = [
  { id: "tkt-001", ticket_number: "TKT-10421", customer_id: null, customer_email: "gabriela@consolidated.co", customer_name: "Gabriela Christiansen", subject: "Where is my order #AA-83920?", category: "Shipping", status: "open", priority: "high", assigned_to: "stf-004", order_id: null, last_reply_at: iso(0, 2), resolved_at: null, created_at: iso(0, 5), updated_at: iso(0, 2) },
  { id: "tkt-002", ticket_number: "TKT-10420", customer_id: null, customer_email: "marcus.bennett@gmail.com", customer_name: "Marcus Bennett", subject: "Request refund for damaged lamp", category: "Returns", status: "pending", priority: "urgent", assigned_to: "stf-004", order_id: null, last_reply_at: iso(0, 4), resolved_at: null, created_at: iso(1), updated_at: iso(0, 4) },
  { id: "tkt-003", ticket_number: "TKT-10419", customer_id: null, customer_email: "yuki.tanaka@outlook.com", customer_name: "Yuki Tanaka", subject: "Can I change my delivery address?", category: "Orders", status: "open", priority: "normal", assigned_to: null, order_id: null, last_reply_at: iso(1), resolved_at: null, created_at: iso(1, 3), updated_at: iso(1) },
  { id: "tkt-004", ticket_number: "TKT-10418", customer_id: null, customer_email: "olivia.h@proton.me", customer_name: "Olivia Hughes", subject: "Discount code not applying at checkout", category: "Billing", status: "pending", priority: "normal", assigned_to: "stf-004", order_id: null, last_reply_at: iso(2), resolved_at: null, created_at: iso(2, 4), updated_at: iso(2) },
  { id: "tkt-005", ticket_number: "TKT-10417", customer_id: null, customer_email: "d.okonkwo@gmail.com", customer_name: "Daniel Okonkwo", subject: "Product question: sofa dimensions", category: "Product", status: "resolved", priority: "low", assigned_to: "stf-004", order_id: null, last_reply_at: iso(3), resolved_at: iso(3), created_at: iso(4), updated_at: iso(3) },
  { id: "tkt-006", ticket_number: "TKT-10416", customer_id: null, customer_email: "ahmed.r@gmail.com", customer_name: "Ahmed Al-Rashid", subject: "Reset my account password", category: "Account", status: "resolved", priority: "high", assigned_to: "stf-004", order_id: null, last_reply_at: iso(5), resolved_at: iso(5), created_at: iso(5, 2), updated_at: iso(5) },
  { id: "tkt-007", ticket_number: "TKT-10415", customer_id: null, customer_email: "sophie.laurent@gmail.com", customer_name: "Sophie Laurent", subject: "Do you ship to France?", category: "Shipping", status: "closed", priority: "low", assigned_to: "stf-003", order_id: null, last_reply_at: iso(8), resolved_at: iso(8), created_at: iso(9), updated_at: iso(8) },
];

export const DEMO_TICKET_MESSAGES: Record<string, TicketMessage[]> = {
  "tkt-001": [
    { id: "msg-1", ticket_id: "tkt-001", author_type: "customer", author_id: null, author_name: "Gabriela Christiansen", body: "Hi, I placed order #AA-83920 five days ago and it still shows 'processing'. Can you tell me when it will ship?", is_internal: false, created_at: iso(0, 5) },
    { id: "msg-2", ticket_id: "tkt-001", author_type: "staff", author_id: "stf-004", author_name: "Priya Nair", body: "Hi Gabriela! Thanks for reaching out. Let me check on that order for you right away.", is_internal: false, created_at: iso(0, 4) },
    { id: "msg-3", ticket_id: "tkt-001", author_type: "staff", author_id: "stf-004", author_name: "Priya Nair", body: "Supplier confirmed dispatch is delayed by 1 day. Offering free express upgrade.", is_internal: true, created_at: iso(0, 3) },
    { id: "msg-4", ticket_id: "tkt-001", author_type: "staff", author_id: "stf-004", author_name: "Priya Nair", body: "Good news, your order ships tomorrow and we've upgraded you to free express delivery at no charge. You'll have it within 2 days!", is_internal: false, created_at: iso(0, 2) },
  ],
  "tkt-002": [
    { id: "msg-5", ticket_id: "tkt-002", author_type: "customer", author_id: null, author_name: "Marcus Bennett", body: "The arc floor lamp arrived with a cracked shade. I'd like a refund or replacement please.", is_internal: false, created_at: iso(1) },
    { id: "msg-6", ticket_id: "tkt-002", author_type: "staff", author_id: "stf-004", author_name: "Priya Nair", body: "Sorry to hear that, Marcus. Please send a photo of the damage and we'll arrange a return label.", is_internal: false, created_at: iso(0, 6) },
    { id: "msg-7", ticket_id: "tkt-002", author_type: "staff", author_id: "stf-004", author_name: "Priya Nair", body: "Flagged for returns team — likely courier damage.", is_internal: true, created_at: iso(0, 5) },
  ],
};

export const DEMO_ACTIVITY: StaffActivity[] = [
  { id: "act-1", staff_id: "stf-005", staff_name: "Leo Schmidt", action: "Marked product as featured", entity_type: "product", entity_id: "long-chair-curved", details: {}, created_at: iso(0, 1) },
  { id: "act-2", staff_id: "stf-003", staff_name: "Diego Martín", action: "Updated markup to 22%", entity_type: "product", entity_id: "scandi-dining-table", details: { from: 18, to: 22 }, created_at: iso(0, 2) },
  { id: "act-3", staff_id: "stf-006", staff_name: "Fatima Zahra", action: "Marked order shipped", entity_type: "order", entity_id: "AA-83918", details: {}, created_at: iso(0, 3) },
  { id: "act-4", staff_id: "stf-004", staff_name: "Priya Nair", action: "Resolved support ticket", entity_type: "ticket", entity_id: "TKT-10417", details: {}, created_at: iso(0, 4) },
  { id: "act-5", staff_id: "stf-002", staff_name: "Amara Okafor", action: "Invited new staff member", entity_type: "staff", entity_id: "stf-007", details: { role: "analyst" }, created_at: iso(1) },
  { id: "act-6", staff_id: "stf-004", staff_name: "Priya Nair", action: "Reset customer password", entity_type: "customer", entity_id: "cus-007", details: {}, created_at: iso(1, 2) },
  { id: "act-7", staff_id: "stf-001", staff_name: "Brayden Pillay", action: "Updated platform settings", entity_type: "settings", entity_id: "1", details: { free_shipping_threshold: 75 }, created_at: iso(3) },
];

export const DEMO_SUPER_ADMIN: StaffMember = DEMO_STAFF[0];
