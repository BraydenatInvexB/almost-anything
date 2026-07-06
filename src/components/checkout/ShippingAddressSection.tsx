"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";
import { toShippingAddress, type CustomerAddress } from "@/types/customer-address";
import type { ShippingAddress } from "@/types/cart";

const NEW_ADDRESS = "__new__";

interface ShippingAddressSectionProps {
  userEmail?: string | null;
  isLoggedIn: boolean;
  address: ShippingAddress;
  onAddressChange: (address: ShippingAddress) => void;
  saveForLater: boolean;
  onSaveForLaterChange: (value: boolean) => void;
}

function formatSavedLabel(address: CustomerAddress): string {
  const parts = [
    address.label,
    address.addressLine1,
    address.city,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function ShippingAddressSection({
  userEmail,
  isLoggedIn,
  address,
  onAddressChange,
  saveForLater,
  onSaveForLaterChange,
}: ShippingAddressSectionProps) {
  const { addresses, loading } = useSavedAddresses(isLoggedIn);
  const [selection, setSelection] = useState<string>(NEW_ADDRESS);
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) prefilledRef.current = false;
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || loading || addresses.length === 0 || prefilledRef.current) return;

    prefilledRef.current = true;
    const defaultAddress = addresses.find((row) => row.isDefault) ?? addresses[0];
    setSelection(defaultAddress.id);
    onAddressChange(toShippingAddress(defaultAddress, userEmail ?? address.email));
  }, [isLoggedIn, loading, addresses, userEmail, onAddressChange, address.email]);

  function handleSelectionChange(id: string) {
    setSelection(id);
    if (id === NEW_ADDRESS) return;

    const saved = addresses.find((row) => row.id === id);
    if (!saved) return;

    onAddressChange(toShippingAddress(saved, userEmail ?? address.email));
  }

  function updateField<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    if (selection !== NEW_ADDRESS) setSelection(NEW_ADDRESS);
    onAddressChange({ ...address, [key]: value });
  }

  return (
    <Card variant="elevated" className="bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MapPin className="h-5 w-5" />
        Shipping Address
      </h2>

      {isLoggedIn && addresses.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-neutral-500">Use a saved address or enter a new one.</p>
          {addresses.map((saved) => (
            <label
              key={saved.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${
                selection === saved.id ? "border-brand bg-brand/5" : "border-neutral-200"
              }`}
            >
              <input
                type="radio"
                name="saved-address"
                value={saved.id}
                checked={selection === saved.id}
                onChange={() => handleSelectionChange(saved.id)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-neutral-900">{saved.fullName}</p>
                <p className="text-sm text-neutral-600">{formatSavedLabel(saved)}</p>
                {saved.isDefault ? (
                  <span className="mt-1 inline-block text-xs font-medium text-brand">Default</span>
                ) : null}
              </div>
            </label>
          ))}
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${
              selection === NEW_ADDRESS ? "border-brand bg-brand/5" : "border-neutral-200"
            }`}
          >
            <input
              type="radio"
              name="saved-address"
              value={NEW_ADDRESS}
              checked={selection === NEW_ADDRESS}
              onChange={() => handleSelectionChange(NEW_ADDRESS)}
            />
            <span className="font-medium text-neutral-900">Use a new address</span>
          </label>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            placeholder="Full name"
            value={address.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            required
            className="rounded-2xl"
          />
        </div>
        <Input
          type="email"
          placeholder="Email"
          value={address.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
          className="rounded-2xl"
        />
        <Input
          placeholder="Phone"
          value={address.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          required
          className="rounded-2xl"
        />
        <div className="sm:col-span-2">
          <Input
            placeholder="Address line 1"
            value={address.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            required
            className="rounded-2xl"
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            placeholder="Address line 2 (optional)"
            value={address.addressLine2 ?? ""}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            className="rounded-2xl"
          />
        </div>
        <Input
          placeholder="City"
          value={address.city}
          onChange={(e) => updateField("city", e.target.value)}
          required
          className="rounded-2xl"
        />
        <Input
          placeholder="Province"
          value={address.state}
          onChange={(e) => updateField("state", e.target.value)}
          required
          className="rounded-2xl"
        />
        <Input
          placeholder="Postal code"
          value={address.postalCode}
          onChange={(e) => updateField("postalCode", e.target.value)}
          required
          className="rounded-2xl"
        />
        <Input
          placeholder="Country"
          value={address.country}
          onChange={(e) => updateField("country", e.target.value)}
          required
          className="rounded-2xl"
        />
      </div>

      {isLoggedIn ? (
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={saveForLater}
            onChange={(e) => onSaveForLaterChange(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Save this address for future orders
        </label>
      ) : null}
    </Card>
  );
}
