import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardHeader from "../components/layout/DashboardHeader";
import Button from "../components/ui/Button";
import Tabs from "../components/ui/Tabs";
import type { Resource, ToastState, UsageLog } from "../types";

type Tab = "resources" | "history";

const tabs: { value: Tab; label: string }[] = [
  { value: "resources", label: "resources" },
  { value: "history", label: "history" },
];

interface PassengerDashboardProps {
  onToast: (toast: ToastState) => void;
}

export default function PassengerDashboard({ onToast }: PassengerDashboardProps) {
  const navigate = useNavigate();
  const auth = JSON.parse(sessionStorage.getItem("auth") || "{}");
  const [tab, setTab] = useState<Tab>("resources");
  const [resources, setResources] = useState<Resource[]>([]);
  const [history, setHistory] = useState<UsageLog[]>([]);
  const [usingResourceId, setUsingResourceId] = useState<string | null>(null);

  const logout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const showError = (err: unknown) => {
    onToast({
      message: err instanceof Error ? err.message : "Something went wrong",
      type: "error",
    });
  };

  const fetchResources = async () => {
    const res = await api.get("/passengers/resources");
    setResources(res.data);
  };

  const fetchHistory = async () => {
    const res = await api.get("/passengers/usage");
    setHistory(res.data);
  };

  useEffect(() => {
    if (tab === "resources") void fetchResources().catch(showError);
    if (tab === "history") void fetchHistory().catch(showError);
  }, [tab]);

  const useResource = async (id: string, name: string) => {
    setUsingResourceId(id);
    try {
      await api.post(`/passengers/resources/${id}/use`);
      onToast({ message: `${name} accessed successfully`, type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setUsingResourceId(null);
    }
  };

  const levelColor: Record<string, string> = {
    SILVER: "text-gray-300 bg-gray-800",
    GOLD: "text-yellow-400 bg-yellow-900/30",
    PLATINUM: "text-cyan-400 bg-cyan-900/30",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader
        role="passenger"
        userName={auth.name}
        onLogout={logout}
      />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Tabs
          items={tabs}
          activeValue={tab}
          accent="emerald"
          onChange={setTab}
        />

        {tab === "resources" && (
          <div className="space-y-2">
            {resources.map((r) => (
              <div
                key={r.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${levelColor[r.minimumLevel]}`}
                    >
                      {r.minimumLevel}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => useResource(r.id, r.name)}
                  variant="success"
                  size="xs"
                  disabled={usingResourceId === r.id}
                >
                  {usingResourceId === r.id ? "Using..." : "Use"}
                </Button>
              </div>
            ))}
            {resources.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-8">
                No resources available for your membership level
              </p>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <p className="text-sm">{log.resourceName}</p>
                <span className="text-xs text-gray-500">
                  {new Date(log.accessedAt).toLocaleString()}
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-8">No usage history yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
