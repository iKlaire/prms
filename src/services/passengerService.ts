import bcrypt from "bcrypt";
import {
  CreatePassengerDTO,
  MembershipLevel,
  Passenger,
  UpdatePassengerDTO,
} from "../domain/passenger";
import {
  ConflictError,
  GoneError,
  NotFoundError,
  ValidationError,
} from "../errors";

export interface PassengerStore {
  create(dto: CreatePassengerDTO): Promise<Passenger>;
  findAll(): Promise<Passenger[]>;
  findById(id: string): Promise<Passenger | null>;
  findActiveByName(name: string): Promise<Passenger | null>;
  update(id: string, dto: UpdatePassengerDTO): Promise<Passenger | null>;
  decommission(id: string): Promise<Passenger | null>;
}

export class PassengerService {
  constructor(private readonly passengerRepo: PassengerStore) {}

  async create(dto: CreatePassengerDTO): Promise<Passenger> {
    if (!dto.name || !dto.password || !dto.membershipLevel) {
      throw new ValidationError(
        "Name, password and membershipLevel are required",
      );
    }

    if (!this.isMembershipLevel(dto.membershipLevel)) {
      throw new ValidationError("Invalid membershipLevel");
    }

    const name = dto.name.trim();
    if (!name) {
      throw new ValidationError(
        "Name, password and membershipLevel are required",
      );
    }

    const existing = await this.passengerRepo.findActiveByName(name);
    if (existing) {
      throw new ConflictError("Passenger with this name already exists");
    }

    return this.passengerRepo.create({
      name,
      password: await bcrypt.hash(dto.password, 10),
      membershipLevel: dto.membershipLevel,
    });
  }

  async createPassenger(dto: CreatePassengerDTO): Promise<Passenger> {
    return this.create(dto);
  }

  async findAll(): Promise<Passenger[]> {
    return this.passengerRepo.findAll();
  }

  async getAllPassengers(): Promise<Passenger[]> {
    return this.findAll();
  }

  async findById(id: string): Promise<Passenger> {
    const passenger = await this.passengerRepo.findById(id);
    if (!passenger) {
      throw new NotFoundError("Passenger not found");
    }

    return passenger;
  }

  async getPassengerById(id: string): Promise<Passenger> {
    return this.findById(id);
  }

  async update(id: string, dto: UpdatePassengerDTO): Promise<Passenger> {
    if (!dto.name && !dto.membershipLevel) {
      throw new ValidationError("At least one field required");
    }

    if (
      dto.membershipLevel &&
      !this.isMembershipLevel(dto.membershipLevel)
    ) {
      throw new ValidationError("Invalid membershipLevel");
    }

    const name = dto.name?.trim();
    if (name) {
      const existing = await this.passengerRepo.findActiveByName(name);
      if (existing && existing.id !== id) {
        throw new ConflictError("Passenger with this name already exists");
      }
    }

    const passenger = await this.passengerRepo.update(id, {
      name,
      membershipLevel: dto.membershipLevel,
    });

    if (!passenger) {
      throw new NotFoundError("Passenger not found");
    }

    return passenger;
  }

  async updatePassenger(
    id: string,
    dto: UpdatePassengerDTO,
  ): Promise<Passenger> {
    return this.update(id, dto);
  }

  async updateMembership(
    id: string,
    membershipLevel: MembershipLevel,
  ): Promise<Passenger> {
    return this.update(id, { membershipLevel });
  }

  async delete(id: string): Promise<void> {
    await this.decommissionPassenger(id);
  }

  async decommissionPassenger(id: string): Promise<Passenger> {
    const current = await this.passengerRepo.findById(id);
    if (!current) {
      throw new NotFoundError("Passenger not found");
    }

    if (!current.isActive) {
      throw new GoneError("Passenger is already decommissioned");
    }

    const passenger = await this.passengerRepo.decommission(id);
    if (!passenger) {
      throw new NotFoundError("Passenger not found");
    }

    return passenger;
  }

  private isMembershipLevel(value: string): value is MembershipLevel {
    return Object.values(MembershipLevel).includes(value as MembershipLevel);
  }
}
