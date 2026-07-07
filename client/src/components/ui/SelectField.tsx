interface SelectFieldProps<T extends string> {
  label?: string;
  value: T;
  options: T[];
  size?: "sm" | "md";
  disabled?: boolean;
  onChange: (value: T) => void;
}

export default function SelectField<T extends string>({
  label,
  value,
  options,
  size = "md",
  disabled = false,
  onChange,
}: SelectFieldProps<T>) {
  const selectClass =
    size === "sm"
      ? "bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
      : "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none";

  return (
    <div>
      {label && <label className="text-xs text-gray-500 mb-1 block">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
