import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type {
  Passenger,
  Resource,
  UsageLog,
  AggregatedUsage,
  ResourceUsageCount,
} from "../types";
import { MembershipLevel, ResourceType } from "../types";

type Tab = "passengers" | "resources" | "reports";

export default function CrewDashboard() {
  const navigate = useNavigate();
  const auth = JSON.parse(sessionStorage.getItem("auth") || "{}");
  const [tab, setTab] = useState<Tab>("passengers");

  // Passengers state
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState<MembershipLevel>(MembershipLevel.SILVER);

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [resName, setResName] = useState("");
  const [resType, setResType] = useState<ResourceType>(ResourceType.FOOD_STATION);
  const [resLevel, setResLevel] = useState<MembershipLevel>(MembershipLevel.SILVER);

  // Reports state
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [byLevel, setByLevel] = useState<AggregatedUsage[]>([]);
  const [topResources, setTopResources] = useState<ResourceUsageCount[]>([]);

  const [error, setError] = useState("");

  const logout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  // Fetch passengers
  const fetchPassengers = async () => {
    const res = await api.get("/crew/passengers");
    setPassengers(res.data);
  };

  // Fetch resources
  const fetchResources = async () => {
    const res = await api.get("/crew/resources");
    setResources(res.data);
  };

  // Fetch reports
  const fetchReports = async () => {
    const [logs, level, top] = await Promise.all([
      api.get("/crew/reports/usage"),
      api.get("/crew/reports/by-level"),
      api.get("/crew/reports/top-resources"),
    ]);
    setUsageLogs(logs.data);
    setByLevel(level.data);
    setTopResources(top.data);
  };

  useEffect(() => {
    if (tab === "passengers") fetchPassengers();
    if (tab === "resources") fetchResources();
    if (tab === "reports") fetchReports();
  }, [tab]);

  const createPassenger = async () => {
    if (!newName) return;
    try {
      await api.post("/crew/passengers", { name: newName, membershipLevel: newLevel });
      setNewName("");
      fetchPassengers();
    } catch (e: unknown) {
      setError("Failed to create passenger");
    }
  };

  const deletePassenger = async (id: string) => {
    await api.delete(`/crew/passengers/${id}`);
    fetchPassengers();
  };

  const updateMembership = async (id: string, level: MembershipLevel) => {
    await api.patch(`/crew/passengers/${id}`, { membershipLevel: level });
    fetchPassengers();
  };

  const provisionResource = async () => {
    if (!resName) return;
    try {
      await api.post("/crew/resources", { name: resName, type: resType, minimumLevel: resLevel });
      setResName("");
      fetchResources();
    } catch (e: unknown) {
      setError("Failed to provision resource");
    }
  };

  const decommissionResource = async (id: string) => {
    await api.delete(`/crew/resources/${id}`);
    fetchResources();
  };

  const tabs: Tab[] = ["passengers", "resources", "reports"];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-lg font-bold">🚀 X26 PRMS</span>
          <span className="ml-3 text-sm text-indigo-400 font-medium">Crew Lead</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Cmdr. {auth.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition-colors">
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-700 text-red-400 rounded-lg px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Passengers Tab */}
        {tab === "passengers" && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Passenger name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as MembershipLevel)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {Object.values(MembershipLevel).map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={createPassenger}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add Passenger
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {passengers.map((p) => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={p.membershipLevel}
                      onChange={(e) => updateMembership(p.id, e.target.value as MembershipLevel)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      {Object.values(MembershipLevel).map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deletePassenger(p.id)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {passengers.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-8">No passengers yet</p>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {tab === "resources" && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-40">
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  placeholder="Resource name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as ResourceType)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {Object.values(ResourceType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Min Level</label>
                <select
                  value={resLevel}
                  onChange={(e) => setResLevel(e.target.value as MembershipLevel)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {Object.values(MembershipLevel).map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={provisionResource}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Provision
              </button>
            </div>

            <div className="space-y-2">
              {resources.map((r) => (
                <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.type} · Min: {r.minimumLevel}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-900/40 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                      {r.isActive ? "Active" : "Decommissioned"}
                    </span>
                    {r.isActive && (
                      <button
                        onClick={() => decommissionResource(r.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                      >
                        Decommission
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {resources.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-8">No resources provisioned</p>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <div className="space-y-8">
            {/* By level */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Usage by Membership Level</h2>
              <div className="grid grid-cols-3 gap-3">
                {byLevel.map((b) => (
                  <div key={b.membershipLevel} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">{b.membershipLevel}</p>
                    <p className="text-2xl font-bold mt-1">{b.totalUsage}</p>
                    <p className="text-xs text-gray-500 mt-1">{b.uniquePassengers} passengers</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top resources */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Most Used Resources</h2>
              <div className="space-y-2">
                {topResources.map((r, i) => (
                  <div key={r.resourceId} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                      <p className="text-sm">{r.resourceName}</p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-400">{r.usageCount} uses</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All logs */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">All Usage Logs</h2>
              <div className="space-y-2">
                {usageLogs.map((log) => (
                  <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm">{log.passengerName} → {log.resourceName}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(log.accessedAt).toLocaleString()}</span>
                  </div>
                ))}
                {usageLogs.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-8">No usage logged yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
