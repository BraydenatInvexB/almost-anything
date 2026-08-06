"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InventoryRecord } from "@/lib/admin/operations-types";
import { StatusBadge, Table, Th, Td } from "@/components/admin/ui";
import { parseLocationInventory } from "@/lib/product/location-inventory";

export function InventoryDesk({
  inventory,
  products,
  canManage,
}: {
  inventory: InventoryRecord[];
  products: { id: string; name: string; slug?: string; metadata?: unknown; quantity?: number }[];
  canManage: boolean;
}) {
  const [q, setQ] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "sa_warehouse" | "overseas">("all");

  const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
  const slugMap = Object.fromEntries(products.map((p) => [p.id, p.slug]));
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

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
              const locationInventory = parseLocationInventory(
                productMap[row.productId]?.metadata,
                row.quantity,
              );
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
                    {row.origin === "sa_warehouse" ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(locationInventory).filter(([, value]) => value > 0).map(([hub, value]) => (
                          <span key={hub} className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase text-emerald-800">
                            {hub} {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <StatusBadge status="available_international" />
                    )}
                  </Td>
                  <Td className="text-xs text-neutral-500">
                    {new Date(row.lastCountedAt).toLocaleDateString("en-ZA")}
                  </Td>
                  {canManage && (
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/products/${slugMap[row.productId] ?? row.productId}`}
                          className="text-xs font-semibold text-brand"
                        >
                          Manage hub stock
                        </Link>
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

    </div>
  );
}
