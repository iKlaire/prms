export enum MembershipLevel {
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
}

export interface Passenger {
  id: string;
  name: string;
  membershipLevel: MembershipLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  minimumLevel: MembershipLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  passengerId: string;
  resourceId: string;
  passengerName: string;
  resourceName: string;
  accessedAt: string;
}

export interface AggregatedUsage {
  membershipLevel: string;
  totalUsage: number;
  uniquePassengers: number;
}

export interface ResourceUsageCount {
  resourceId: string;
  resourceName: string;
  usageCount: number;
}

export type UserRole = "crew" | "passenger";

export interface AuthState {
  role: UserRole;
  id: string;
  name: string;
}

export interface ToastState {
  message: string;
  type: "success" | "error";
}
