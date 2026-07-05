export enum MembershipLevel {
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
}

export interface Passenger {
  id: string;
  name: string;
  membershipLevel: MembershipLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePassengerDTO {
  name: string;
  membershipLevel: MembershipLevel;
}

export interface UpdateMembershipDTO {
  membershipLevel: MembershipLevel;
}
