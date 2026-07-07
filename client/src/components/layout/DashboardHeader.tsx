import Button from "../ui/Button";

type DashboardRole = "crew" | "passenger";

interface DashboardHeaderProps {
  role: DashboardRole;
  userName: string;
  onLogout: () => void;
}

const roleConfig: Record<
  DashboardRole,
  { label: string; accentClass: string; userPrefix: string }
> = {
  crew: {
    label: "Crew Lead",
    accentClass: "text-indigo-400",
    userPrefix: "Cmdr. ",
  },
  passenger: {
    label: "Passenger",
    accentClass: "text-emerald-400",
    userPrefix: "",
  },
};

export default function DashboardHeader({
  role,
  userName,
  onLogout,
}: DashboardHeaderProps) {
  const config = roleConfig[role];

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <div>
        <span className="text-lg font-bold">X26 PRMS</span>
        <span className={`ml-3 text-sm font-medium ${config.accentClass}`}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {config.userPrefix}
          {userName}
        </span>
        <Button onClick={onLogout} variant="text" size="sm">
          Log out
        </Button>
      </div>
    </nav>
  );
}
