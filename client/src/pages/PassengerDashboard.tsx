import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { Resource, ToastState, UsageLog } from "../types";

type Tab = "resources" | "history";

interface PassengerDashboardProps {
  onToast: (toast: ToastState) => void;
}

export default function PassengerDashboard({ onToast }: PassengerDashboardProps) {
  const navigate = useNavigate();
  const auth = JSON.parse(sessionStorage.getItem("auth") || "{}");
  const [tab, setTab] = useState<Tab>("resources");
  const [resources, setResources] = useState<Resource[]>([]);
  const [history, setHistory] = useState<UsageLog[]>([]);

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
    try {
      await api.post(`/passengers/resources/${id}/use`);
      onToast({ message: `${name} accessed successfully`, type: "success" });
    } catch (e: unknown) {
      showError(e);
    }
  };

  const levelColor: Record<string, string> = {
    SILVER: "text-gray-300 bg-gray-800",
    GOLD: "text-yellow-400 bg-yellow-900/30",
    PLATINUM: "text-cyan-400 bg-cyan-900/30",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-lg font-bold">🚀 X26 PRMS</span>
          <span className="ml-3 text-sm text-emerald-400 font-medium">Passenger</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{auth.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition-colors">
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {(["resources", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Resources */}
        {tab === "resources" && (
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${levelColor[r.minimumLevel]}`}>
                      {r.minimumLevel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => useResource(r.id, r.name)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Use
                </button>
              </div>
            ))}
            {resources.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-8">No resources available for your membership level</p>
            )}
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div className="space-y-2">
            {history.map((log) => (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                <p className="text-sm">{log.resourceName}</p>
                <span className="text-xs text-gray-500">{new Date(log.accessedAt).toLocaleString()}</span>
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
