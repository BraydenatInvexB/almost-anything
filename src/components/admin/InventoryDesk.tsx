"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { InventoryRecord } from "@/lib/admin/operations-types";
import { StatusBadge, Table, Th, Td } from "@/components/admin/ui";

export function InventoryDesk({
  inventory,
  products,
  canManage,
}: {
  inventory: InventoryRecord[];
  products: { id: string; name: string; slug?: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "sa_warehouse" | "overseas">("all");
  const [adjusting, setAdjusting] = useState<InventoryRecord | null>(null);

  const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
  const slugMap = Object.fromEntries(products.map((p) => [p.id, p.slug]));

  const rows = useMemo(() => {
    let list = inventory;
    if (originFilter !== "all") list = list.filter((i) => i.origin === originFilter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (i) =>
          i.sku.toLowerCase().includes(needle) ||
          (nameMap[i.productId] ?? "").toLowerCase().includes(needle),
      );
    }
    return list;
  }, [inventory, originFilter, q, nameMap]);

  async function patch(productId: string, patch: Partial<InventoryRecord>) {
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, ...patch }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="min-w-[220px] flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by SKU or product name…"
            className="h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-brand/40"
          />
        </div>
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value as typeof originFilter)}
          className="h-10 rounded-lg border border-neutral-200 px-3 text-sm"
        >
          <option value="all">All locations</option>
          <option value="sa_warehouse">SA warehouse</option>
          <option value="overseas">International warehouse</option>
        </select>
      </div>

      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <Table>
          <thead>
            <tr>
              <Th>SKU</Th>
              <Th>Product</Th>
              <Th>On hand</Th>
              <Th>Reorder at</Th>
              <Th>Location</Th>
              <Th>Last counted</Th>
              {canManage && <Th>Actions</Th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {rows.map((row) => {
              const low = row.quantity <= row.reorderPoint;
              return (
                <tr key={row.productId} className={low ? "bg-amber-50/40" : undefined}>
                  <Td className="font-mono text-xs">{row.sku}</Td>
                  <Td>
                    <Link
                      href={`/admin/products/${slugMap[row.productId] ?? row.productId}`}
                      className="font-medium text-neutral-950 hover:text-brand"
                    >
                      {nameMap[row.productId] ?? row.productId}
                    </Link>
                  </Td>
                  <Td className={low ? "font-bold text-amber-700" : "font-semibold"}>
                    {row.quantity}
                  </Td>
                  <Td>{row.reorderPoint}</Td>
                  <Td>
                    <StatusBadge
                      status={row.origin === "sa_warehouse" ? "in_stock" : "available_international"}
                    />
                    <p className="mt-0.5 text-xs text-neutral-400">{row.warehouse}</p>
                  </Td>
                  <Td className="text-xs text-neutral-500">
                    {new Date(row.lastCountedAt).toLocaleDateString("en-ZA")}
                  </Td>
                  {canManage && (
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => patch(row.productId, { quantity: row.quantity + 1 })}
                          className="text-xs font-semibold text-brand"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => patch(row.productId, { quantity: row.quantity + 10 })}
                          className="text-xs font-semibold text-brand"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjusting(row)}
                          className="text-xs font-semibold text-neutral-600"
                        >
                          Set qty
                        </button>
                      </div>
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-500">No inventory rows match.</p>
        )}
      </div>

      {adjusting && canManage && (
        <AdjustModal
          row={adjusting}
          productName={nameMap[adjusting.productId] ?? adjusting.productId}
          onClose={() => setAdjusting(null)}
          onSave={(qty, reorder) => {
            void patch(adjusting.productId, {
              quantity: qty,
              reorderPoint: reorder,
              lastCountedAt: new Date().toISOString(),
            });
            setAdjusting(null);
          }}
        />
      )}
    </div>
  );
}

function AdjustModal({
  row,
  productName,
  onClose,
  onSave,
}: {
  row: InventoryRecord;
  productName: string;
  onClose: () => void;
  onSave: (qty: number, reorder: number) => void;
}) {
  const [qty, setQty] = useState(String(row.quantity));
  const [reorder, setReorder] = useState(String(row.reorderPoint));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="font-bold text-neutral-950">Adjust stock</h3>
        <p className="text-sm text-neutral-500">{productName}</p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-neutral-600">
            Quantity on hand
            <input
              type="number"
              className="input mt-1 w-full"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-600">
            Reorder point
            <input
              type="number"
              className="input mt-1 w-full"
              value={reorder}
              onChange={(e) => setReorder(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onSave(Number(qty), Number(reorder))}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
