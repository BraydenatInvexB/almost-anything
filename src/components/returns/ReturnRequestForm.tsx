"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReturnMethod, ReturnReasonCode } from "@/lib/admin/operations-types";
import { RETURN_METHODS, RETURN_REASONS } from "@/lib/returns/returns";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface ReturnFormOrder {
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: { id: string; name: string; quantity: number; price: number }[];
}

export function ReturnRequestForm({
  order,
  onSuccess,
}: {
  order?: ReturnFormOrder;
  onSuccess?: (returnReference: string) => void;
}) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(order?.orderNumber ?? "");
  const [customerEmail, setCustomerEmail] = useState(order?.customerEmail ?? "");
  const [customerName, setCustomerName] = useState(order?.customerName ?? "");
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>("damaged");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<ReturnMethod>("courier_pickup");
  const [loadedItems, setLoadedItems] = useState(order?.items ?? []);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    order?.items.map((i) => i.id) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (order?.items.length) {
      setLoadedItems(order.items);
      setSelectedItems(order.items.map((i) => i.id));
    }
  }, [order?.items]);

  useEffect(() => {
    const trimmed = orderNumber.trim();
    if (!trimmed || order?.orderNumber) return;
    const controller = new AbortController();
    fetch(`/api/orders?orderNumber=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.order?.items?.length) {
          setLoadedItems(
            data.order.items.map((i: { id: string; name: string; quantity: number; price: number }) => ({
              id: i.id,
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
          );
          setSelectedItems(data.order.items.map((i: { id: string }) => i.id));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [orderNumber, order?.orderNumber]);

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          customerEmail: customerEmail.trim(),
          customerName: customerName.trim() || undefined,
          reasonCode,
          reason: reason.trim(),
          method,
          itemIds: loadedItems.length ? selectedItems : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not submit return request.");
        return;
      }
      const ref = data.return?.rmaNumber ?? "your return reference";
      setSuccess(`Return submitted successfully. Your return reference is ${ref}.`);
      onSuccess?.(ref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="elevated" className="bg-white p-6 sm:p-8">
      <form onSubmit={submit} className="space-y-5">
        {!order?.orderNumber && (
          <div>
            <label htmlFor="return-order-number" className="text-sm font-medium text-neutral-700">
              Order number
            </label>
            <input
              id="return-order-number"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. AA-83915"
              required
            />
          </div>
        )}
        {!order?.customerEmail && (
          <div>
            <label htmlFor="return-email" className="text-sm font-medium text-neutral-700">
              Email on order
            </label>
            <input
              id="return-email"
              type="email"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
          </div>
        )}
        {!order?.customerName && (
          <div>
            <label htmlFor="return-name" className="text-sm font-medium text-neutral-700">
              Your name
            </label>
            <input
              id="return-name"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        )}

        {loadedItems.length > 0 && (
          <div>
            <p className="text-sm font-medium text-neutral-700">Items to return</p>
            <ul className="mt-2 space-y-2">
              {loadedItems.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="flex-1">{item.name} × {item.quantity}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="return-reason-code" className="text-sm font-medium text-neutral-700">
            Reason
          </label>
          <select
            id="return-reason-code"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
          >
            {RETURN_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="return-details" className="text-sm font-medium text-neutral-700">
            Details
          </label>
          <textarea
            id="return-details"
            className="mt-1 min-h-[100px] w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue — include damage details if applicable."
            required
          />
        </div>

        <div>
          <label htmlFor="return-method" className="text-sm font-medium text-neutral-700">
            Return method
          </label>
          <select
            id="return-method"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value as ReturnMethod)}
          >
            {RETURN_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>
        )}

        <Button type="submit" disabled={busy || (loadedItems.length ? selectedItems.length === 0 : false)}>
          {busy ? "Submitting…" : "Submit return request"}
        </Button>
      </form>
    </Card>
  );
}
