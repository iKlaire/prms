import { MembershipLevel } from "../src/domain/passenger";
import { Resource } from "../src/domain/resource";
import {
  ResourceService,
  ResourceStore,
} from "../src/services/resourceService";

const now = new Date("2026-01-01T00:00:00Z");

const createResource = (
  id: string,
  name: string,
  minimumLevel: MembershipLevel,
  isActive = true,
): Resource => ({
  id,
  name,
  minimumLevel,
  isActive,
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
      findById: jest.fn(),
      findByName: jest.fn(),
      findActiveByMinimumLevels: jest.fn(),
      update: jest.fn(),
      decommission: jest.fn(),
      reactivate: jest.fn(),
    };
    service = new ResourceService(resourceRepo);
  });

  it("provisionResource creates resource correctly", async () => {
    const resource = createResource(
      "resource-1",
      "Food Station",
      MembershipLevel.SILVER,
    );
    resourceRepo.findByName.mockResolvedValue(null);
    resourceRepo.create.mockResolvedValue(resource);

    await expect(
      service.provisionResource({
        name: "Food Station",
        minimumLevel: MembershipLevel.SILVER,
      }),
    ).resolves.toEqual(resource);
  });

  it("provisionResource throws 409 on duplicate name case-insensitively", async () => {
    resourceRepo.findByName.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER),
    );

    await expect(
      service.provisionResource({
        name: "food station",
        minimumLevel: MembershipLevel.SILVER,
      }),
    ).rejects.toThrow("Resource with this name already exists");
  });

  it("updateResource updates minimumLevel", async () => {
    const updated = createResource(
      "resource-1",
      "Food Station",
      MembershipLevel.GOLD,
    );
    resourceRepo.update.mockResolvedValue(updated);

    await expect(
      service.updateResource("resource-1", {
        minimumLevel: MembershipLevel.GOLD,
      }),
    ).resolves.toEqual(updated);
  });

  it("updateResource updates name", async () => {
    const updated = createResource(
      "resource-1",
      "Hydration Bay",
      MembershipLevel.SILVER,
    );
    resourceRepo.findByName.mockResolvedValue(null);
    resourceRepo.update.mockResolvedValue(updated);

    await expect(
      service.updateResource("resource-1", { name: "Hydration Bay" }),
    ).resolves.toEqual(updated);
  });

  it("updateResource throws when no fields are provided", async () => {
    await expect(service.updateResource("resource-1", {})).rejects.toThrow(
      "At least one field required",
    );
  });

  it("updateResource throws 404 when not found", async () => {
    resourceRepo.update.mockResolvedValue(null);

    await expect(
      service.updateResource("missing", { minimumLevel: MembershipLevel.GOLD }),
    ).rejects.toThrow("Resource not found");
  });

  it("updateResource throws 409 on name conflict", async () => {
    resourceRepo.findByName.mockResolvedValue(
      createResource("resource-2", "Food Station", MembershipLevel.SILVER),
    );

    await expect(
      service.updateResource("resource-1", { name: "Food Station" }),
    ).rejects.toThrow("Resource with this name already exists");
  });

  it("decommissionResource sets isActive false", async () => {
    resourceRepo.findById.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER),
    );
    resourceRepo.decommission.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER, false),
    );

    await expect(
      service.decommissionResource("resource-1"),
    ).resolves.toMatchObject({ isActive: false });
  });

  it("decommissionResource throws 409 when already inactive", async () => {
    resourceRepo.findById.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER, false),
    );

    await expect(
      service.decommissionResource("resource-1"),
    ).rejects.toThrow("Resource is already decommissioned");
  });

  it("reactivateResource sets isActive true", async () => {
    resourceRepo.findById.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER, false),
    );
    resourceRepo.reactivate.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER),
    );

    await expect(
      service.reactivateResource("resource-1"),
    ).resolves.toMatchObject({ isActive: true });
  });

  it("reactivateResource throws 409 when already active", async () => {
    resourceRepo.findById.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER),
    );

    await expect(
      service.reactivateResource("resource-1"),
    ).rejects.toThrow("Resource is already active");
  });

  it("decommission then reactivate restores correctly", async () => {
    resourceRepo.findById
      .mockResolvedValueOnce(
        createResource("resource-1", "Food Station", MembershipLevel.SILVER),
      )
      .mockResolvedValueOnce(
        createResource(
          "resource-1",
          "Food Station",
          MembershipLevel.SILVER,
          false,
        ),
      );
    resourceRepo.decommission.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER, false),
    );
    resourceRepo.reactivate.mockResolvedValue(
      createResource("resource-1", "Food Station", MembershipLevel.SILVER),
    );

    await expect(
      service.decommissionResource("resource-1"),
    ).resolves.toMatchObject({ isActive: false });
    await expect(
      service.reactivateResource("resource-1"),
    ).resolves.toMatchObject({ isActive: true });
  });

  it("findAccessibleByLevel GOLD returns SILVER and GOLD resources", async () => {
    const resources = [
      createResource("resource-1", "Food Station", MembershipLevel.SILVER),
      createResource("resource-2", "Private Cabin", MembershipLevel.GOLD),
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
});
