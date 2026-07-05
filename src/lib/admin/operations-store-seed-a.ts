import type {
  Campaign,
  EmailBroadcast,
  EmailSubscriber,
  Expense,
  ExtendedPlatformConfig,
} from "@/lib/admin/operations-types";
import type { SupplierPayable } from "@/lib/admin/finance-types";
import type { Permission } from "@/config/rbac";
import type { StaffRole, StaffStatus } from "@/types/database";
import { DEFAULT_EXTENDED_CONFIG } from "@/lib/admin/extended-config-defaults";

export interface StaffAccessOverride {
  role?: StaffRole;
  status?: StaffStatus;
  extra_permissions?: Permission[];
  denied_permissions?: Permission[];
  department?: string | null;
  title?: string | null;
}

type IsoFn = (daysAgo?: number, hoursAgo?: number) => string;

export function seedConfigAndStaff(): {
  config: ExtendedPlatformConfig;
  staffOverrides: Record<string, StaffAccessOverride>;
  deletedStaffIds: string[];
} {
  return {
    config: structuredClone(DEFAULT_EXTENDED_CONFIG),
    staffOverrides: {
      "stf-004": { denied_permissions: ["finance.view", "finance.manage", "hr.view", "hr.manage"] },
      "stf-009": { denied_permissions: ["support.view", "support.manage", "hr.view", "hr.manage"] },
      "stf-010": { denied_permissions: ["support.view", "support.manage", "finance.view", "finance.manage"] },
    },
    deletedStaffIds: [],
  };
}

export function seedCampaigns(iso: IsoFn): Campaign[] {
  return [
    {
      id: "cmp-001",
      name: "Summer Clearance",
      channel: "multi",
      status: "live",
      promoCode: "SUMMER25",
      discountPercent: 25,
      audience: "All subscribers",
      startsAt: iso(14),
      endsAt: iso(-30),
      reach: 12480,
      clicks: 598,
      createdAt: iso(20),
    },
    {
      id: "cmp-002",
      name: "New Arrivals Drop",
      channel: "email",
      status: "scheduled",
      audience: "VIP customers",
      startsAt: iso(-7),
      reach: 0,
      clicks: 0,
      createdAt: iso(5),
    },
  ];
}

export function seedEmailSubscribers(iso: IsoFn): EmailSubscriber[] {
  return [
    { id: "sub-001", email: "deals@example.com", name: "Newsletter fan", source: "newsletter", status: "active", subscribedAt: iso(30) },
    { id: "sub-002", email: "gabriela@consolidated.co", name: "Gabriela Christiansen", source: "customer", status: "active", subscribedAt: iso(60), tags: ["vip"] },
    { id: "sub-003", email: "marcus.bennett@gmail.com", name: "Marcus Bennett", source: "customer", status: "active", subscribedAt: iso(45) },
    { id: "sub-004", email: "hello@almostanything.store", source: "manual", status: "active", subscribedAt: iso(10) },
  ];
}

export function seedEmailBroadcasts(iso: IsoFn): EmailBroadcast[] {
  return [
    {
      id: "eml-001",
      subject: "Summer clearance — up to 25% off",
      previewText: "Fresh deals just dropped across the store.",
      body: "Hi there,\n\nOur summer clearance is live with up to 25% off thousands of items. Shop now before your favourites sell out.\n\n— Almost Anything",
      audience: "all",
      status: "sent",
      recipientCount: 8420,
      sentAt: iso(7),
      createdBy: "Amara Okafor",
      createdAt: iso(8),
    },
  ];
}

export function seedExpenses(iso: IsoFn): Expense[] {
  return [
    {
      id: "exp-001",
      label: "Supplier purchase batch #441",
      category: "procurement",
      amount: 18420,
      currency: "ZAR",
      vendor: "Global Sourcing Co",
      recordedBy: "Amara Okafor",
      recordedAt: iso(2),
    },
    {
      id: "exp-002",
      label: "Aramex monthly account",
      category: "shipping",
      amount: 4200,
      currency: "ZAR",
      vendor: "Aramex",
      recordedAt: iso(5),
      recordedBy: "Fatima Zahra",
    },
    {
      id: "exp-003",
      label: "Refund AA3915",
      category: "refunds",
      amount: 890,
      currency: "ZAR",
      orderId: "ord-1015",
      recordedBy: "Priya Nair",
      recordedAt: iso(1),
    },
    {
      id: "exp-004",
      label: "Google Ads Q2",
      category: "marketing",
      amount: 6200,
      currency: "ZAR",
      vendor: "Google",
      recordedBy: "Leo Schmidt",
      recordedAt: iso(8),
      notes: "Performance max campaigns",
    },
    {
      id: "exp-005",
      label: "Staff salaries March",
      category: "payroll",
      amount: 142000,
      currency: "ZAR",
      vendor: "Payroll",
      recordedBy: "James van Wyk",
      recordedAt: iso(12),
    },
    {
      id: "exp-006",
      label: "Fastway courier account",
      category: "shipping",
      amount: 3100,
      currency: "ZAR",
      vendor: "Fastway",
      recordedBy: "Fatima Zahra",
      recordedAt: iso(4),
    },
    {
      id: "exp-007",
      label: "Warehouse rent",
      category: "operations",
      amount: 28500,
      currency: "ZAR",
      vendor: "Sandton Industrial",
      recordedBy: "Thandi Mokoena",
      recordedAt: iso(15),
    },
    {
      id: "exp-008",
      label: "Payment gateway fees",
      category: "operations",
      amount: 1840,
      currency: "ZAR",
      vendor: "Stripe",
      recordedBy: "Thandi Mokoena",
      recordedAt: iso(3),
      notes: "Card processing fees",
    },
  ];
}

export function seedPayables(iso: IsoFn): SupplierPayable[] {
  return [
    {
      id: "pay-001",
      invoiceNumber: "INV-NHS-8842",
      vendor: "Nordic Home Supply",
      category: "procurement",
      amount: 4200,
      currency: "ZAR",
      dueDate: iso(-2),
      status: "overdue",
      orderNumber: "AA3920",
      procurementId: "proc-001",
      notes: "Long Chair overseas purchase",
      createdAt: iso(4),
    },
    {
      id: "pay-002",
      invoiceNumber: "INV-GSC-1204",
      vendor: "Global Sourcing Co",
      category: "procurement",
      amount: 18420,
      currency: "ZAR",
      dueDate: iso(7),
      status: "approved",
      createdAt: iso(2),
    },
    {
      id: "pay-003",
      invoiceNumber: "INV-ARX-331",
      vendor: "Aramex",
      category: "shipping",
      amount: 4200,
      currency: "ZAR",
      dueDate: iso(14),
      status: "pending",
      createdAt: iso(5),
    },
    {
      id: "pay-004",
      invoiceNumber: "INV-JLW-009",
      vendor: "Joburg Lighting WH",
      category: "procurement",
      amount: 680,
      currency: "ZAR",
      dueDate: iso(-10),
      status: "paid",
      orderNumber: "AA3919",
      procurementId: "proc-002",
      createdAt: iso(6),
      paidAt: iso(3),
    },
  ];
}
