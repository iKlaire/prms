interface SelectFieldProps<T extends string> {
  label?: string;
  value: T;
  options: T[];
  size?: "sm" | "md";
  onChange: (value: T) => void;
}

export default function SelectField<T extends string>({
  label,
  value,
  options,
  size = "md",
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
        className={selectClass}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
