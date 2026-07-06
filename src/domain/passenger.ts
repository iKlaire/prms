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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePassengerDTO {
  name: string;
  password: string;
  membershipLevel: MembershipLevel;
}

export interface UpdatePassengerDTO {
  name?: string;
  membershipLevel?: MembershipLevel;
}

export interface PassengerWithPassword extends Passenger {
  password: string;
}
