import { MembershipLevel } from "../domain/passenger";
import {
  CreateResourceDTO,
  Resource,
  ResourceType,
} from "../domain/resource";
import { LEVEL_ACCESS } from "./usageService";

export interface ResourceStore {
  create(dto: CreateResourceDTO): Promise<Resource>;
  findAll(): Promise<Resource[]>;
  findActiveByMinimumLevels(levels: MembershipLevel[]): Promise<Resource[]>;
  decommission(id: string): Promise<Resource | null>;
}

export class ResourceService {
  constructor(private readonly resourceRepo: ResourceStore) {}

  async provision(dto: CreateResourceDTO): Promise<Resource> {
    if (!dto.name || !dto.type || !dto.minimumLevel) {
      throw new Error("name, type and minimumLevel are required");
    }

    if (!this.isResourceType(dto.type)) {
      throw new Error("Invalid type");
    }

    if (!this.isMembershipLevel(dto.minimumLevel)) {
      throw new Error("Invalid minimumLevel");
    }

    return this.resourceRepo.create({
      name: dto.name.trim(),
      type: dto.type,
      minimumLevel: dto.minimumLevel,
    });
  }

  async findAll(): Promise<Resource[]> {
    return this.resourceRepo.findAll();
  }

  async findAccessibleByLevel(
    membershipLevel: MembershipLevel,
  ): Promise<Resource[]> {
    if (!this.isMembershipLevel(membershipLevel)) {
      throw new Error("Invalid membershipLevel");
    }

    return this.resourceRepo.findActiveByMinimumLevels(
      LEVEL_ACCESS[membershipLevel],
    );
  }

  async decommission(id: string): Promise<Resource> {
    const resource = await this.resourceRepo.decommission(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    return resource;
  }

  private isMembershipLevel(value: string): value is MembershipLevel {
    return Object.values(MembershipLevel).includes(value as MembershipLevel);
  }

  private isResourceType(value: string): value is ResourceType {
    return Object.values(ResourceType).includes(value as ResourceType);
  }
}
