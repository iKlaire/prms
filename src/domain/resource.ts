import { MembershipLevel } from "./passenger";

export interface Resource {
  id: string;
  name: string;
  minimumLevel: MembershipLevel;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceDTO {
  name: string;
  minimumLevel: MembershipLevel;
}

export interface UpdateResourceDTO {
  name?: string;
  minimumLevel?: MembershipLevel;
}
