"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, User, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/admin/ui";

type OrderHit = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  currency: string;
};

type CustomerHit = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
};

export function AdminEntitySearch({
  mode = "all",
  placeholder = "Search orders or customers…",
  onSelectOrder,
  onSelectCustomer,
  autoFocus,
}: {
  mode?: "all" | "orders" | "customers";
  placeholder?: string;
  onSelectOrder?: (order: OrderHit) => void;
  onSelectCustomer?: (customer: CustomerHit) => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderHit[]>([]);
  const [customers, setCustomers] = useState<CustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 1) {
      setOrders([]);
      setCustomers([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(q.trim())}&type=${mode}&limit=8`,
        );
        const data = await res.json();
        setOrders(data.orders ?? []);
        setCustomers(data.customers ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q, mode]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const hasResults = orders.length > 0 || customers.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim() && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          {!hasResults && !loading && (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">No matches for “{q}”</p>
          )}

          {orders.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Orders
              </p>
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50"
                  onClick={() => {
                    onSelectOrder?.(o);
                    setQ(o.orderNumber);
                    setOpen(false);
                  }}
                >
                  <Package className="h-4 w-4 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-950">{o.orderNumber}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {o.customerName} · {formatCurrency(o.total, o.currency)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </button>
              ))}
            </div>
          )}

          {customers.length > 0 && (
            <div className={orders.length > 0 ? "border-t border-neutral-100" : ""}>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                Customers
              </p>
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50"
                  onClick={() => {
                    onSelectCustomer?.(c);
                    setQ(c.full_name);
                    setOpen(false);
                  }}
                >
                  <User className="h-4 w-4 shrink-0 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-950">{c.full_name}</p>
                    <p className="truncate text-xs text-neutral-500">{c.email}</p>
                  </div>
                  {!onSelectCustomer && (
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="text-xs font-semibold text-brand"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
