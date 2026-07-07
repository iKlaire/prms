import { MembershipLevel } from "../domain/passenger";
import {
  CreateResourceDTO,
  Resource,
  UpdateResourceDTO,
} from "../domain/resource";
import {
  ConflictError,
  GoneError,
  NotFoundError,
  ValidationError,
} from "../errors";
import { LEVEL_ACCESS } from "./usageService";

export interface ResourceStore {
  create(dto: CreateResourceDTO): Promise<Resource>;
  findAll(): Promise<Resource[]>;
  findById(id: string): Promise<Resource | null>;
  findByName(name: string): Promise<Resource | null>;
  findActiveByMinimumLevels(levels: MembershipLevel[]): Promise<Resource[]>;
  update(id: string, dto: UpdateResourceDTO): Promise<Resource | null>;
  decommission(id: string): Promise<Resource | null>;
  reactivate(id: string): Promise<Resource | null>;
}

export class ResourceService {
  constructor(private readonly resourceRepo: ResourceStore) {}

  async provisionResource(dto: CreateResourceDTO): Promise<Resource> {
    if (!dto.name || !dto.minimumLevel) {
      throw new ValidationError("name and minimumLevel are required");
    }

    if (!this.isMembershipLevel(dto.minimumLevel)) {
      throw new ValidationError("Invalid minimumLevel");
    }

    const name = dto.name.trim();
    if (!name) {
      throw new ValidationError("name and minimumLevel are required");
    }

    const existing = await this.resourceRepo.findByName(name);
    if (existing) {
      throw new ConflictError("Resource with this name already exists");
    }

    return this.resourceRepo.create({
      name,
      minimumLevel: dto.minimumLevel,
    });
  }

  async provision(dto: CreateResourceDTO): Promise<Resource> {
    return this.provisionResource(dto);
  }

  async findAll(): Promise<Resource[]> {
    return this.resourceRepo.findAll();
  }

  async findAccessibleByLevel(
    membershipLevel: MembershipLevel,
  ): Promise<Resource[]> {
    if (!this.isMembershipLevel(membershipLevel)) {
      throw new ValidationError("Invalid membershipLevel");
    }

    return this.resourceRepo.findActiveByMinimumLevels(
      LEVEL_ACCESS[membershipLevel],
    );
  }

  async updateResource(
    id: string,
    dto: UpdateResourceDTO,
  ): Promise<Resource> {
    if (!dto.name && !dto.minimumLevel) {
      throw new ValidationError("At least one field required");
    }

    if (
      dto.minimumLevel &&
      !this.isMembershipLevel(dto.minimumLevel)
    ) {
      throw new ValidationError("Invalid minimumLevel");
    }

    const name = dto.name?.trim();
    if (name) {
      const existing = await this.resourceRepo.findByName(name);
      if (existing && existing.id !== id) {
        throw new ConflictError("Resource with this name already exists");
      }
    }

    const resource = await this.resourceRepo.update(id, {
      name,
      minimumLevel: dto.minimumLevel,
    });
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    return resource;
  }

  async decommissionResource(id: string): Promise<Resource> {
    const current = await this.resourceRepo.findById(id);
    if (!current) {
      throw new NotFoundError("Resource not found");
    }

    if (!current.isActive) {
      throw new GoneError("Resource is already decommissioned");
    }

    const resource = await this.resourceRepo.decommission(id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    return resource;
  }

  async decommission(id: string): Promise<Resource> {
    return this.decommissionResource(id);
  }

  async reactivateResource(id: string): Promise<Resource> {
    const current = await this.resourceRepo.findById(id);
    if (!current) {
      throw new NotFoundError("Resource not found");
    }

    if (current.isActive) {
      throw new ConflictError("Resource is already active");
    }

    const resource = await this.resourceRepo.reactivate(id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    return resource;
  }

  private isMembershipLevel(value: string): value is MembershipLevel {
    return Object.values(MembershipLevel).includes(value as MembershipLevel);
  }
}
