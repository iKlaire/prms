import type { CrewLead } from "../domain/crewLead";
import type { Passenger } from "../domain/passenger";

export interface AuthCrewLeadStore {
  findByName(name: string): Promise<CrewLead | null>;
}

export interface AuthPassengerStore {
  findByName(name: string): Promise<Passenger | null>;
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

    const crewLead = await this.crewLeadRepo.findByName(name.trim());
    if (!crewLead) {
      throw new Error("Invalid credentials");
    }

    return crewLead;
  }

  async loginPassenger(name: string, password: string): Promise<Passenger> {
    if (!name || !password) {
      throw new Error("Invalid credentials");
    }

    const passenger = await this.passengerRepo.findByName(name.trim());
    if (!passenger) {
      throw new Error("Invalid credentials");
    }

    return passenger;
  }
}
