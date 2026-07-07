interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "password";
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function Field({
  label,
  value,
  placeholder,
  type = "text",
  className = "",
  disabled = false,
  onChange,
}: FieldProps) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
