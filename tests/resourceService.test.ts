import { MembershipLevel } from "../src/domain/passenger";
import { Resource, ResourceType } from "../src/domain/resource";
import {
  ResourceService,
  ResourceStore,
} from "../src/services/resourceService";

const now = new Date("2026-01-01T00:00:00Z");

const createResource = (minimumLevel: MembershipLevel): Resource => ({
  id: `resource-${minimumLevel}`,
  name: `${minimumLevel} Resource`,
  type: ResourceType.FOOD_STATION,
  minimumLevel,
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

describe("ResourceService", () => {
  let resourceRepo: jest.Mocked<ResourceStore>;
  let service: ResourceService;

  beforeEach(() => {
    resourceRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findActiveByMinimumLevels: jest.fn(),
      decommission: jest.fn(),
    };
    service = new ResourceService(resourceRepo);
  });

  it("provisions a resource and returns the domain shape", async () => {
    const resource = createResource(MembershipLevel.SILVER);
    resourceRepo.create.mockResolvedValue(resource);

    await expect(
      service.provision({
        name: "Food Station",
        type: ResourceType.FOOD_STATION,
        minimumLevel: MembershipLevel.SILVER,
      }),
    ).resolves.toEqual(resource);
  });

  it("decommissions a resource", async () => {
    const resource = {
      ...createResource(MembershipLevel.GOLD),
      isActive: false,
    };
    resourceRepo.decommission.mockResolvedValue(resource);

    await expect(service.decommission("resource-1")).resolves.toMatchObject({
      isActive: false,
    });
  });

  it("findAccessibleByLevel SILVER returns only SILVER resources", async () => {
    const resources = [createResource(MembershipLevel.SILVER)];
    resourceRepo.findActiveByMinimumLevels.mockResolvedValue(resources);

    await expect(
      service.findAccessibleByLevel(MembershipLevel.SILVER),
    ).resolves.toEqual(resources);
    expect(resourceRepo.findActiveByMinimumLevels).toHaveBeenCalledWith([
      MembershipLevel.SILVER,
    ]);
  });

  it("findAccessibleByLevel GOLD returns SILVER and GOLD resources", async () => {
    const resources = [
      createResource(MembershipLevel.SILVER),
      createResource(MembershipLevel.GOLD),
    ];
    resourceRepo.findActiveByMinimumLevels.mockResolvedValue(resources);

    await expect(
      service.findAccessibleByLevel(MembershipLevel.GOLD),
    ).resolves.toEqual(resources);
    expect(resourceRepo.findActiveByMinimumLevels).toHaveBeenCalledWith([
      MembershipLevel.SILVER,
      MembershipLevel.GOLD,
    ]);
  });

  it("findAccessibleByLevel PLATINUM returns all resources", async () => {
    const resources = [
      createResource(MembershipLevel.SILVER),
      createResource(MembershipLevel.GOLD),
      createResource(MembershipLevel.PLATINUM),
    ];
    resourceRepo.findActiveByMinimumLevels.mockResolvedValue(resources);

    await expect(
      service.findAccessibleByLevel(MembershipLevel.PLATINUM),
    ).resolves.toEqual(resources);
    expect(resourceRepo.findActiveByMinimumLevels).toHaveBeenCalledWith([
      MembershipLevel.SILVER,
      MembershipLevel.GOLD,
      MembershipLevel.PLATINUM,
    ]);
  });
});
