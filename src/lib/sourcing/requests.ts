import type { CustomerItemRequest, ItemRequestStatus } from "@/lib/admin/operations-types";

export const ITEM_REQUEST_STATUSES: { value: ItemRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "searching", label: "Searching" },
  { value: "found", label: "Found" },
  { value: "quoted", label: "Quoted" },
  { value: "purchased", label: "Purchased" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

export function itemRequestStatusLabel(status: ItemRequestStatus): string {
  return ITEM_REQUEST_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function formatItemRequestAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function computeItemRequestMetrics(requests: CustomerItemRequest[]) {
  const open = requests.filter(
    (r) => !["delivered", "failed", "purchased", "shipped"].includes(r.status),
  ).length;
  const searching = requests.filter((r) => r.status === "searching" || r.status === "pending").length;
  const quoted = requests.filter((r) => r.status === "quoted").length;
  const unassigned = requests.filter(
    (r) => !r.assignedTo && !["delivered", "failed"].includes(r.status),
  ).length;
  return { open, searching, quoted, unassigned, total: requests.length };
}

export function sortItemRequestsForQueue(requests: CustomerItemRequest[]) {
  const priority: Record<ItemRequestStatus, number> = {
    pending: 0,
    searching: 1,
    found: 2,
    quoted: 3,
    purchased: 4,
    shipped: 5,
    delivered: 6,
    failed: 7,
  };
  return [...requests].sort((a, b) => {
    const pd = priority[a.status] - priority[b.status];
    if (pd !== 0) return pd;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
