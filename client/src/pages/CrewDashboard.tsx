import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashboardHeader from "../components/layout/DashboardHeader";
import Tabs from "../components/ui/Tabs";
import PassengersTab from "../features/crew/PassengersTab";
import ReportsTab from "../features/crew/ReportsTab";
import ResourcesTab from "../features/crew/ResourcesTab";
import type {
  AggregatedUsage,
  Passenger,
  Resource,
  ResourceUsageCount,
  ToastState,
  UsageLog,
} from "../types";
import { MembershipLevel } from "../types";

type Tab = "passengers" | "resources" | "reports";

interface CrewDashboardProps {
  onToast: (toast: ToastState) => void;
}

const tabs: { value: Tab; label: string }[] = [
  { value: "passengers", label: "passengers" },
  { value: "resources", label: "resources" },
  { value: "reports", label: "reports" },
];

export default function CrewDashboard({ onToast }: CrewDashboardProps) {
  const navigate = useNavigate();
  const auth = JSON.parse(sessionStorage.getItem("auth") || "{}");
  const [tab, setTab] = useState<Tab>("passengers");
  const [isCreatingPassenger, setIsCreatingPassenger] = useState(false);
  const [busyPassengerId, setBusyPassengerId] = useState<string | null>(null);
  const [isProvisioningResource, setIsProvisioningResource] = useState(false);
  const [busyResourceId, setBusyResourceId] = useState<string | null>(null);

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newLevel, setNewLevel] = useState<MembershipLevel>(
    MembershipLevel.SILVER,
  );

  const [resources, setResources] = useState<Resource[]>([]);
  const [resName, setResName] = useState("");
  const [resLevel, setResLevel] = useState<MembershipLevel>(
    MembershipLevel.SILVER,
  );

  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [byLevel, setByLevel] = useState<AggregatedUsage[]>([]);
  const [topResources, setTopResources] = useState<ResourceUsageCount[]>([]);

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

  const fetchPassengers = async () => {
    const res = await api.get("/crew/passengers");
    setPassengers(res.data);
  };

  const fetchResources = async () => {
    const res = await api.get("/crew/resources");
    setResources(res.data);
  };

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
    if (tab === "passengers") void fetchPassengers().catch(showError);
    if (tab === "resources") void fetchResources().catch(showError);
    if (tab === "reports") void fetchReports().catch(showError);
  }, [tab]);

  const createPassenger = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName || !newPassword) {
      onToast({ message: "Name and password required", type: "error" });
      return;
    }

    setIsCreatingPassenger(true);
    try {
      await api.post("/crew/passengers", {
        name: trimmedName,
        password: newPassword,
        membershipLevel: newLevel,
      });
      setNewName("");
      setNewPassword("");
      await fetchPassengers();
      onToast({ message: "Passenger created", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setIsCreatingPassenger(false);
    }
  };

  const decommissionPassenger = async (id: string) => {
    setBusyPassengerId(id);
    try {
      await api.delete(`/crew/passengers/${id}`);
      await fetchPassengers();
      onToast({ message: "Passenger decommissioned", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setBusyPassengerId(null);
    }
  };

  const updateMembership = async (id: string, level: MembershipLevel) => {
    setBusyPassengerId(id);
    try {
      await api.patch(`/crew/passengers/${id}`, { membershipLevel: level });
      await fetchPassengers();
      onToast({ message: "Passenger updated", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setBusyPassengerId(null);
    }
  };

  const provisionResource = async () => {
    const trimmedName = resName.trim();
    if (!trimmedName) {
      onToast({ message: "Resource name required", type: "error" });
      return;
    }

    setIsProvisioningResource(true);
    try {
      await api.post("/crew/resources", {
        name: trimmedName,
        minimumLevel: resLevel,
      });
      setResName("");
      await fetchResources();
      onToast({ message: "Resource provisioned", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setIsProvisioningResource(false);
    }
  };

  const decommissionResource = async (id: string) => {
    setBusyResourceId(id);
    try {
      await api.delete(`/crew/resources/${id}`);
      await fetchResources();
      onToast({ message: "Resource decommissioned", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setBusyResourceId(null);
    }
  };

  const reactivateResource = async (id: string) => {
    setBusyResourceId(id);
    try {
      await api.patch(`/crew/resources/${id}/reactivate`);
      await fetchResources();
      onToast({ message: "Resource reactivated", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setBusyResourceId(null);
    }
  };

  const updateResourceLevel = async (id: string, level: MembershipLevel) => {
    setBusyResourceId(id);
    try {
      await api.patch(`/crew/resources/${id}`, { minimumLevel: level });
      await fetchResources();
      onToast({ message: "Resource updated", type: "success" });
    } catch (e: unknown) {
      showError(e);
    } finally {
      setBusyResourceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader role="crew" userName={auth.name} onLogout={logout} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs items={tabs} activeValue={tab} onChange={setTab} />

        {tab === "passengers" && (
          <PassengersTab
            passengers={passengers}
            newName={newName}
            newPassword={newPassword}
            newLevel={newLevel}
            isCreatingPassenger={isCreatingPassenger}
            busyPassengerId={busyPassengerId}
            onNameChange={setNewName}
            onPasswordChange={setNewPassword}
            onLevelChange={setNewLevel}
            onCreatePassenger={createPassenger}
            onUpdateMembership={updateMembership}
            onDecommissionPassenger={decommissionPassenger}
          />
        )}

        {tab === "resources" && (
          <ResourcesTab
            resources={resources}
            resName={resName}
            resLevel={resLevel}
            isProvisioningResource={isProvisioningResource}
            busyResourceId={busyResourceId}
            onNameChange={setResName}
            onLevelChange={setResLevel}
            onProvisionResource={provisionResource}
            onUpdateResourceLevel={updateResourceLevel}
            onDecommissionResource={decommissionResource}
            onReactivateResource={reactivateResource}
          />
        )}

        {tab === "reports" && (
          <ReportsTab
            usageLogs={usageLogs}
            byLevel={byLevel}
            topResources={topResources}
          />
        )}
      </div>
    </div>
  );
}
