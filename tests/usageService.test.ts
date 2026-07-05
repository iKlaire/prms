import { MembershipLevel } from "../src/domain/passenger";
import { ResourceType } from "../src/domain/resource";
import {
  UsageLogStore,
  UsagePassengerStore,
  UsageResourceStore,
  UsageService,
} from "../src/services/usageService";

const now = new Date("2026-01-01T00:00:00Z");

const createResource = (minimumLevel: MembershipLevel, isActive = true) => ({
  id: "resource-1",
  name: "Hydration Station",
  type: ResourceType.FOOD_STATION,
  minimumLevel,
  isActive,
  createdAt: now,
  updatedAt: now,
});

describe("UsageService", () => {
  let usageLogRepo: jest.Mocked<UsageLogStore>;
  let passengerRepo: jest.Mocked<UsagePassengerStore>;
  let resourceRepo: jest.Mocked<UsageResourceStore>;
  let service: UsageService;

  beforeEach(() => {
    usageLogRepo = {
      create: jest.fn(),
      findByPassengerIdWithDetails: jest.fn(),
      findAllWithDetails: jest.fn(),
      aggregateByLevel: jest.fn(),
      topResources: jest.fn(),
    };
    passengerRepo = {
      findById: jest.fn(),
    };
    resourceRepo = {
      findById: jest.fn(),
    };
    service = new UsageService(usageLogRepo, passengerRepo, resourceRepo);
  });

  it("throws when a SILVER passenger accesses a GOLD resource", async () => {
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.SILVER,
    });
    resourceRepo.findById.mockResolvedValue(
      createResource(MembershipLevel.GOLD),
    );

    await expect(
      service.useResource("passenger-1", "resource-1"),
    ).rejects.toThrow("Access denied");
  });

  it("throws when a SILVER passenger accesses a PLATINUM resource", async () => {
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.SILVER,
    });
    resourceRepo.findById.mockResolvedValue(
      createResource(MembershipLevel.PLATINUM),
    );

    await expect(
      service.useResource("passenger-1", "resource-1"),
    ).rejects.toThrow("Access denied");
  });

  it("allows a GOLD passenger to access a SILVER resource", async () => {
    const log = {
      id: "log-1",
      passengerId: "passenger-1",
      resourceId: "resource-1",
      accessedAt: now,
    };
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.GOLD,
    });
    resourceRepo.findById.mockResolvedValue(
      createResource(MembershipLevel.SILVER),
    );
    usageLogRepo.create.mockResolvedValue(log);

    await expect(
      service.useResource("passenger-1", "resource-1"),
    ).resolves.toEqual(log);
  });

  it("allows a PLATINUM passenger to access all resource levels", async () => {
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.PLATINUM,
    });
    usageLogRepo.create.mockResolvedValue({
      id: "log-1",
      passengerId: "passenger-1",
      resourceId: "resource-1",
      accessedAt: now,
    });

    for (const level of Object.values(MembershipLevel)) {
      resourceRepo.findById.mockResolvedValue(createResource(level));
      await expect(
        service.useResource("passenger-1", "resource-1"),
      ).resolves.toMatchObject({ passengerId: "passenger-1" });
    }
  });

  it("throws for a decommissioned resource", async () => {
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.PLATINUM,
    });
    resourceRepo.findById.mockResolvedValue(
      createResource(MembershipLevel.SILVER, false),
    );

    await expect(
      service.useResource("passenger-1", "resource-1"),
    ).rejects.toThrow("Resource is decommissioned");
  });

  it("throws for a non-existent resource", async () => {
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.PLATINUM,
    });
    resourceRepo.findById.mockResolvedValue(null);

    await expect(
      service.useResource("passenger-1", "missing"),
    ).rejects.toThrow("Resource not found");
  });

  it("throws for a non-existent passenger", async () => {
    passengerRepo.findById.mockResolvedValue(null);

    await expect(
      service.useResource("missing", "resource-1"),
    ).rejects.toThrow("Passenger not found");
  });

  it("creates a usage log on successful use", async () => {
    const log = {
      id: "log-1",
      passengerId: "passenger-1",
      resourceId: "resource-1",
      accessedAt: now,
    };
    passengerRepo.findById.mockResolvedValue({
      id: "passenger-1",
      membershipLevel: MembershipLevel.SILVER,
    });
    resourceRepo.findById.mockResolvedValue(
      createResource(MembershipLevel.SILVER),
    );
    usageLogRepo.create.mockResolvedValue(log);

    await expect(
      service.useResource("passenger-1", "resource-1"),
    ).resolves.toEqual(log);
    expect(usageLogRepo.create).toHaveBeenCalledWith(
      "passenger-1",
      "resource-1",
    );
  });
});
