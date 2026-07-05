import { MembershipLevel } from "./passenger";

export enum ResourceType {
  FOOD_STATION = "FOOD_STATION",
  SLEEPING_POD = "SLEEPING_POD",
  BASIC_HYGIENE = "BASIC_HYGIENE",
  PRIVATE_CABIN = "PRIVATE_CABIN",
  ADVANCED_MEDICAL_BAY = "ADVANCED_MEDICAL_BAY",
  LUXURY_O2_POD = "LUXURY_O2_POD",
  VIP_REC_DECK = "VIP_REC_DECK",
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  minimumLevel: MembershipLevel;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceDTO {
  name: string;
  type: ResourceType;
  minimumLevel: MembershipLevel;
}
