interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Decommissioned",
}: StatusBadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        active ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
