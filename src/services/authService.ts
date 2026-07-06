import bcrypt from "bcrypt";
import type { CrewLead } from "../domain/crewLead";
import type { Passenger } from "../domain/passenger";

export interface AuthCrewLeadStore {
  findByNameWithPassword(
    name: string,
  ): Promise<(CrewLead & { password: string }) | null>;
}

export interface AuthPassengerStore {
  findByNameWithPassword(
    name: string,
  ): Promise<(Passenger & { password: string }) | null>;
}

export class AuthService {
  constructor(
    private readonly crewLeadRepo: AuthCrewLeadStore,
    private readonly passengerRepo: AuthPassengerStore,
  ) {}

  async loginCrewLead(name: string, password: string): Promise<CrewLead> {
    if (!name || !password) {
      throw new Error("Invalid credentials");
    }

    const crewLead = await this.crewLeadRepo.findByNameWithPassword(
      name.trim(),
    );
    if (!crewLead || !(await bcrypt.compare(password, crewLead.password))) {
      throw new Error("Invalid credentials");
    }

    return this.withoutPassword(crewLead);
  }

  async loginPassenger(name: string, password: string): Promise<Passenger> {
    if (!name || !password) {
      throw new Error("Invalid credentials");
    }

    const passenger = await this.passengerRepo.findByNameWithPassword(
      name.trim(),
    );
    if (!passenger || !(await bcrypt.compare(password, passenger.password))) {
      throw new Error("Invalid credentials");
    }

    return this.withoutPassword(passenger);
  }

  private withoutPassword<T extends { password: string }>(
    value: T,
  ): Omit<T, "password"> {
    const { password: _password, ...rest } = value;
    return rest;
  }
}
