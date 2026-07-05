import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import { DEMO_TICKETS, DEMO_TICKET_MESSAGES } from "@/lib/admin/demo-data";
import type {
  AdminProductDraft,
  CheckoutOrderRecord,
  CustomerItemRequest,
  InventoryRecord,
  ProcurementRecord,
  ReturnRequest,
  SiteAnalytics,
} from "@/lib/admin/operations-types";
import type { SupportTicket, TicketMessage } from "@/types/database";

type IsoFn = (daysAgo?: number, hoursAgo?: number) => string;

export function seedReturns(iso: IsoFn): ReturnRequest[] {
  return [
    {
      id: "ret-001",
      rmaNumber: "RMA-48291",
      orderId: "ord-1005",
      orderNumber: "AA3915",
      customerName: "Marcus Bennett",
      customerEmail: "marcus.bennett@gmail.com",
      reasonCode: "damaged",
      reason: "Damaged lamp shade on arrival — packaging was crushed on one corner.",
      items: [
        {
          orderItemId: "li-001",
          name: "Arc Floor Lamp",
          quantity: 1,
          unitPrice: 890,
          returnQuantity: 1,
        },
      ],
      method: "courier_pickup",
      status: "approved",
      refundAmount: 890,
      currency: "ZAR",
      restockItems: false,
      notes: [
        {
          id: "rn-001",
          body: "Customer sent photos — shade cracked. Approved for pickup.",
          authorName: "Thandi Mokoena",
          authorType: "staff",
          isInternal: true,
          createdAt: iso(2),
        },
      ],
      createdAt: iso(3),
      updatedAt: iso(2),
      approvedAt: iso(2),
    },
    {
      id: "ret-002",
      rmaNumber: "RMA-48304",
      orderId: "ord-1008",
      orderNumber: "AA3912",
      customerName: "Olivia Hughes",
      customerEmail: "olivia.h@proton.me",
      reasonCode: "wrong_item",
      reason: "Received a 2-seater instead of the 3-seater sofa I ordered.",
      items: [
        {
          orderItemId: "li-002",
          name: "Modular Corner Sofa",
          quantity: 1,
          unitPrice: 12499,
          returnQuantity: 1,
        },
      ],
      method: "courier_pickup",
      status: "requested",
      refundAmount: 12499,
      currency: "ZAR",
      restockItems: true,
      notes: [],
      createdAt: iso(1),
      updatedAt: iso(1),
    },
    {
      id: "ret-003",
      rmaNumber: "RMA-48102",
      orderId: "ord-1012",
      orderNumber: "AA3908",
      customerName: "James Okonkwo",
      customerEmail: "j.okonkwo@outlook.com",
      reasonCode: "changed_mind",
      reason: "Colour doesn't match the room after seeing it in person.",
      items: [
        {
          orderItemId: "li-003",
          name: "Velvet Accent Chair",
          quantity: 2,
          unitPrice: 2199,
          returnQuantity: 2,
        },
      ],
      method: "drop_off",
      status: "received",
      refundAmount: 4398,
      currency: "ZAR",
      restockItems: true,
      notes: [
        {
          id: "rn-002",
          body: "Items received at Johannesburg DC — condition good, tags attached.",
          authorName: "System",
          authorType: "system",
          isInternal: true,
          createdAt: iso(0),
        },
      ],
      createdAt: iso(5),
      updatedAt: iso(0),
      approvedAt: iso(4),
      receivedAt: iso(0),
    },
  ];
}

export function seedItemRequests(iso: IsoFn): CustomerItemRequest[] {
  return [
    {
      id: "req-seed-001",
      requestNumber: "REQ-10482",
      query: "Vintage leather armchair, cognac brown, under R15,000",
      customerEmail: "marcus.bennett@gmail.com",
      budget: 15000,
      currency: "ZAR",
      urgency: "standard",
      status: "searching",
      assignedTo: "stf-003",
      assignedToName: "Jordan Kim",
      createdAt: iso(0, 3),
      updatedAt: iso(0, 1),
    },
    {
      id: "req-seed-002",
      requestNumber: "REQ-10471",
      query: "PlayStation 5 Digital Edition with extra controller",
      customerEmail: "gabriela@consolidated.co",
      budget: 12000,
      currency: "ZAR",
      urgency: "express",
      status: "quoted",
      assignedTo: "stf-001",
      assignedToName: "Alex Rivera",
      quotedAmount: 11499,
      internalNotes: "Supplier confirmed — quote sent to customer.",
      createdAt: iso(1, 5),
      updatedAt: iso(0, 8),
    },
    {
      id: "req-seed-003",
      requestNumber: "REQ-10455",
      query: "Mid-century dining set for 6, teak or walnut",
      customerEmail: "zara.mthembu@outlook.com",
      budget: 25000,
      currency: "ZAR",
      urgency: "flexible",
      status: "pending",
      createdAt: iso(2),
      updatedAt: iso(2),
    },
  ];
}

export function seedProcurement(iso: IsoFn): ProcurementRecord[] {
  return [
    {
      id: "proc-001",
      orderId: "ord-1001",
      orderNumber: "AA3920",
      productName: "Long Chair",
      quantity: 1,
      supplier: "Nordic Home Supply",
      supplierCountry: "Netherlands",
      costPrice: 4200,
      sellPrice: 8999,
      currency: "ZAR",
      status: "in_transit",
      origin: "overseas",
      orderedAt: iso(4),
      expectedAt: iso(-3),
      supplierOrderRef: "NHS-88421",
      inboundTracking: "1Z999AA10123456784",
    },
    {
      id: "proc-002",
      orderId: "ord-1002",
      orderNumber: "AA3919",
      productName: "Arc Floor Lamp",
      quantity: 1,
      supplier: "Joburg Lighting WH",
      supplierCountry: "South Africa",
      costPrice: 680,
      sellPrice: 1299,
      currency: "ZAR",
      status: "received",
      origin: "sa_warehouse",
      orderedAt: iso(6),
      receivedAt: iso(3),
    },
  ];
}

export function seedInventory(iso: IsoFn): InventoryRecord[] {
  return SEED_PRODUCTS.slice(0, 12).map((p, i) => ({
    productId: `seed-${p.slug}`,
    sku: `AA-${p.slug.slice(0, 8).toUpperCase()}`,
    quantity: p.stock_status === "out_of_stock" ? 0 : p.stock_status === "low_stock" ? 4 : 28 - i,
    reorderPoint: 5,
    origin: i % 3 === 0 ? ("overseas" as const) : ("sa_warehouse" as const),
    warehouse: i % 3 === 0 ? "Overseas pipeline" : "Johannesburg DC",
    lastCountedAt: iso(i % 5),
  }));
}

export function seedTickets(): {
  tickets: SupportTicket[];
  ticketMessages: Record<string, TicketMessage[]>;
} {
  return {
    tickets: [...DEMO_TICKETS],
    ticketMessages: { ...DEMO_TICKET_MESSAGES },
  };
}

export function seedAnalytics(iso: IsoFn): SiteAnalytics {
  return {
    totalVisits: 48210,
    uniqueSessions: 31680,
    pageViews: 128400,
    conversionRate: 2.8,
    dailyVisits: Array.from({ length: 7 }, (_, i) => ({
      date: iso(6 - i).slice(0, 10),
      visits: 5200 + i * 340,
      orders: 42 + i * 3,
    })),
    topPages: [
      { path: "/", views: 28400 },
      { path: "/products", views: 19200 },
      { path: "/products/playstation-5", views: 8400 },
      { path: "/cart", views: 6200 },
      { path: "/checkout", views: 4100 },
    ],
  };
}

export function seedEmptyCollections(): {
  customProducts: AdminProductDraft[];
  checkoutOrders: CheckoutOrderRecord[];
} {
  return {
    customProducts: [],
    checkoutOrders: [],
  };
}
