import bcrypt from "bcrypt";
import type { CrewLead } from "../domain/crewLead";
import type { Passenger } from "../domain/passenger";
import { AuthenticationError } from "../errors";
import { AuthTokenService } from "./authTokenService";

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

export interface AuthResult<T> {
  token: string;
  user: T;
}

export class AuthService {
  constructor(
    private readonly crewLeadRepo: AuthCrewLeadStore,
    private readonly passengerRepo: AuthPassengerStore,
    private readonly tokenService: AuthTokenService = new AuthTokenService(),
  ) {}

  async loginCrewLead(
    name: string,
    password: string,
  ): Promise<AuthResult<CrewLead>> {
    if (!name || !password) {
      throw new AuthenticationError();
    }

    const crewLead = await this.crewLeadRepo.findByNameWithPassword(
      name.trim(),
    );
    if (!crewLead || !(await bcrypt.compare(password, crewLead.password))) {
      throw new AuthenticationError();
    }

    const user = this.withoutPassword(crewLead);
    return {
      token: this.tokenService.sign({ sub: user.id, role: "crew" }),
      user,
    };
  }

  async loginPassenger(
    name: string,
    password: string,
  ): Promise<AuthResult<Passenger>> {
    if (!name || !password) {
      throw new AuthenticationError();
    }

    const passenger = await this.passengerRepo.findByNameWithPassword(
      name.trim(),
    );
    if (!passenger || !(await bcrypt.compare(password, passenger.password))) {
      throw new AuthenticationError();
    }

    const user = this.withoutPassword(passenger);
    return {
      token: this.tokenService.sign({ sub: user.id, role: "passenger" }),
      user,
    };
  }

  private withoutPassword<T extends { password: string }>(
    value: T,
  ): Omit<T, "password"> {
    const { password: _password, ...rest } = value;
    return rest;
  }
}
