import type { InventoryRecord } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listInventory() {
  return state.inventory;
}

export function updateInventory(productId: string, patch: Partial<InventoryRecord>) {
  const idx = state.inventory.findIndex((i) => i.productId === productId);
  if (idx < 0) return null;
  state.inventory[idx] = {
    ...state.inventory[idx],
    ...patch,
    lastCountedAt: new Date().toISOString(),
  };
  return state.inventory[idx];
}
