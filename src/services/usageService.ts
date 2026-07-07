import { MembershipLevel } from "../domain/passenger";
import type {
  AggregatedUsage,
  ResourceUsageCount,
  UsageLog,
  UsageLogWithDetails,
} from "../domain/usageLog";
import type { Resource } from "../domain/resource";
import { ForbiddenError, GoneError, NotFoundError } from "../errors";

export interface UsagePassengerStore {
  findById(id: string): Promise<{
    id: string;
    membershipLevel: MembershipLevel;
  } | null>;
}

export interface UsageResourceStore {
  findById(id: string): Promise<Resource | null>;
}

export interface UsageLogStore {
  create(passengerId: string, resourceId: string): Promise<UsageLog>;
  findByPassengerIdWithDetails(
    passengerId: string,
  ): Promise<UsageLogWithDetails[]>;
  findAllWithDetails(): Promise<UsageLogWithDetails[]>;
  aggregateByLevel(): Promise<AggregatedUsage[]>;
  topResources(): Promise<ResourceUsageCount[]>;
}

export const LEVEL_ACCESS: Record<MembershipLevel, MembershipLevel[]> = {
  [MembershipLevel.SILVER]: [MembershipLevel.SILVER],
  [MembershipLevel.GOLD]: [MembershipLevel.SILVER, MembershipLevel.GOLD],
  [MembershipLevel.PLATINUM]: [
    MembershipLevel.SILVER,
    MembershipLevel.GOLD,
    MembershipLevel.PLATINUM,
  ],
};

export class UsageService {
  constructor(
    private readonly usageLogRepo: UsageLogStore,
    private readonly passengerRepo: UsagePassengerStore,
    private readonly resourceRepo: UsageResourceStore,
  ) {}

  async useResource(
    passengerId: string,
    resourceId: string,
  ): Promise<UsageLog> {
    const passenger = await this.passengerRepo.findById(passengerId);
    if (!passenger) {
      throw new NotFoundError("Passenger not found");
    }

    const resource = await this.resourceRepo.findById(resourceId);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    if (!resource.isActive) {
      throw new GoneError("Resource is decommissioned");
    }

    const allowedLevels = LEVEL_ACCESS[passenger.membershipLevel];
    if (!allowedLevels.includes(resource.minimumLevel)) {
      throw new ForbiddenError("Access denied. Insufficient membership level");
    }

    return this.usageLogRepo.create(passenger.id, resource.id);
  }

  async findPassengerUsage(
    passengerId: string,
  ): Promise<UsageLogWithDetails[]> {
    return this.usageLogRepo.findByPassengerIdWithDetails(passengerId);
  }

  async findAllUsage(): Promise<UsageLogWithDetails[]> {
    return this.usageLogRepo.findAllWithDetails();
  }

  async aggregateByLevel(): Promise<AggregatedUsage[]> {
    return this.usageLogRepo.aggregateByLevel();
  }

  async topResources(): Promise<ResourceUsageCount[]> {
    return this.usageLogRepo.topResources();
  }
}
