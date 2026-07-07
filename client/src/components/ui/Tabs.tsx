type TabAccent = "indigo" | "emerald";

interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  activeValue: T;
  accent?: TabAccent;
  onChange: (value: T) => void;
}

const activeClasses: Record<TabAccent, string> = {
  indigo: "border-indigo-500 text-white",
  emerald: "border-emerald-500 text-white",
};

export default function Tabs<T extends string>({
  items,
  activeValue,
  accent = "indigo",
  onChange,
}: TabsProps<T>) {
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-800">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
            activeValue === item.value
              ? activeClasses[accent]
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
