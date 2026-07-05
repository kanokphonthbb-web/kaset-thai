"use client";

export default function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 1,
  hint,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  suffix?: string;
  min?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center rounded-full bg-paper ring-1 ring-ash focus-within:ring-2 focus-within:ring-ink">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="min-h-[48px] w-full rounded-full bg-transparent px-4 text-base text-ink focus:outline-none"
        />
        {suffix && (
          <span className="whitespace-nowrap px-4 text-sm text-stone">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}
