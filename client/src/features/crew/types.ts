import type {
  AggregatedUsage,
  MembershipLevel,
  Passenger,
  Resource,
  ResourceUsageCount,
  UsageLog,
} from "../../types";

export interface PassengersTabProps {
  passengers: Passenger[];
  newName: string;
  newPassword: string;
  newLevel: MembershipLevel;
  isCreatingPassenger: boolean;
  busyPassengerId: string | null;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLevelChange: (value: MembershipLevel) => void;
  onCreatePassenger: () => void;
  onUpdateMembership: (id: string, level: MembershipLevel) => void;
  onDecommissionPassenger: (id: string) => void;
}

export interface ResourcesTabProps {
  resources: Resource[];
  resName: string;
  resLevel: MembershipLevel;
  isProvisioningResource: boolean;
  busyResourceId: string | null;
  onNameChange: (value: string) => void;
  onLevelChange: (value: MembershipLevel) => void;
  onProvisionResource: () => void;
  onUpdateResourceLevel: (id: string, level: MembershipLevel) => void;
  onDecommissionResource: (id: string) => void;
  onReactivateResource: (id: string) => void;
}

export interface ReportsTabProps {
  usageLogs: UsageLog[];
  byLevel: AggregatedUsage[];
  topResources: ResourceUsageCount[];
}
