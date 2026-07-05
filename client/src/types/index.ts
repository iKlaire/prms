export enum MembershipLevel {
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
}

export enum ResourceType {
  FOOD_STATION = "FOOD_STATION",
  SLEEPING_POD = "SLEEPING_POD",
  BASIC_HYGIENE = "BASIC_HYGIENE",
  PRIVATE_CABIN = "PRIVATE_CABIN",
  ADVANCED_MEDICAL_BAY = "ADVANCED_MEDICAL_BAY",
  LUXURY_O2_POD = "LUXURY_O2_POD",
  VIP_REC_DECK = "VIP_REC_DECK",
}

export interface Passenger {
  id: string;
  name: string;
  membershipLevel: MembershipLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
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
