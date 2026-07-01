export interface CourierSelectOption {
  id: string;
  name: string;
}

export function CarrierSelect({
  value,
  onChange,
  couriers,
  className,
  disabled,
}: {
  value: string;
  onChange: (name: string) => void;
  couriers: CourierSelectOption[];
  className?: string;
  disabled?: boolean;
}) {
  const known = new Set(couriers.map((c) => c.name));
  const showLegacy = Boolean(value && !known.has(value));

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    >
      <option value="">Select courier</option>
      {showLegacy && (
        <option value={value}>
          {value} (saved)
        </option>
      )}
      {couriers.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
