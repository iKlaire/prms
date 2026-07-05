import {
  CreatePassengerDTO,
  MembershipLevel,
  Passenger,
} from "../domain/passenger";
import type { UpdatePassengerDTO } from "../repositories/passengerRepository";

export interface PassengerStore {
  create(dto: CreatePassengerDTO): Promise<Passenger>;
  findAll(): Promise<Passenger[]>;
  findById(id: string): Promise<Passenger | null>;
  update(id: string, dto: UpdatePassengerDTO): Promise<Passenger | null>;
  delete(id: string): Promise<boolean>;
}

export class PassengerService {
  constructor(private readonly passengerRepo: PassengerStore) {}

  async create(dto: CreatePassengerDTO): Promise<Passenger> {
    if (!dto.name || !dto.membershipLevel) {
      throw new Error("Name and membershipLevel are required");
    }

    if (!this.isMembershipLevel(dto.membershipLevel)) {
      throw new Error("Invalid membershipLevel");
    }

    return this.passengerRepo.create({
      name: dto.name.trim(),
      membershipLevel: dto.membershipLevel,
    });
  }

  async findAll(): Promise<Passenger[]> {
    return this.passengerRepo.findAll();
  }

  async findById(id: string): Promise<Passenger> {
    const passenger = await this.passengerRepo.findById(id);
    if (!passenger) {
      throw new Error("Passenger not found");
    }

    return passenger;
  }

  async update(id: string, dto: UpdatePassengerDTO): Promise<Passenger> {
    if (!dto.name && !dto.membershipLevel) {
      throw new Error("At least one field required");
    }

    if (
      dto.membershipLevel &&
      !this.isMembershipLevel(dto.membershipLevel)
    ) {
      throw new Error("Invalid membershipLevel");
    }

    const passenger = await this.passengerRepo.update(id, {
      name: dto.name?.trim(),
      membershipLevel: dto.membershipLevel,
    });

    if (!passenger) {
      throw new Error("Passenger not found");
    }

    return passenger;
  }

  async updateMembership(
    id: string,
    membershipLevel: MembershipLevel,
  ): Promise<Passenger> {
    return this.update(id, { membershipLevel });
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.passengerRepo.delete(id);
    if (!deleted) {
      throw new Error("Passenger not found");
    }
  }

  private isMembershipLevel(value: string): value is MembershipLevel {
    return Object.values(MembershipLevel).includes(value as MembershipLevel);
  }
}
