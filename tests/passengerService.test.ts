import bcrypt from "bcrypt";
import { MembershipLevel, Passenger } from "../src/domain/passenger";
import {
  PassengerService,
  PassengerStore,
} from "../src/services/passengerService";

const now = new Date("2026-01-01T00:00:00Z");

const passenger: Passenger = {
  id: "passenger-1",
  name: "Ada Lovelace",
  membershipLevel: MembershipLevel.GOLD,
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

describe("PassengerService", () => {
  let passengerRepo: jest.Mocked<PassengerStore>;
  let service: PassengerService;

  beforeEach(() => {
    passengerRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      update: jest.fn(),
      decommission: jest.fn(),
    };
    service = new PassengerService(passengerRepo);
  });

  it("createPassenger creates with correct fields and isActive true by default", async () => {
    passengerRepo.findActiveByName.mockResolvedValue(null);
    passengerRepo.create.mockResolvedValue(passenger);

    await expect(
      service.createPassenger({
        name: "Ada Lovelace",
        password: "password123",
        membershipLevel: MembershipLevel.GOLD,
      }),
    ).resolves.toEqual(passenger);

    const createArg = passengerRepo.create.mock.calls[0][0];
    expect(createArg.name).toBe("Ada Lovelace");
    expect(createArg.membershipLevel).toBe(MembershipLevel.GOLD);
    expect(createArg.password).not.toBe("password123");
    await expect(
      bcrypt.compare("password123", createArg.password),
    ).resolves.toBe(true);
  });

  it("createPassenger throws 409 on duplicate active name case-insensitively", async () => {
    passengerRepo.findActiveByName.mockResolvedValue(passenger);

    await expect(
      service.createPassenger({
        name: "ada lovelace",
        password: "password123",
        membershipLevel: MembershipLevel.GOLD,
      }),
    ).rejects.toThrow("Passenger with this name already exists");
  });

  it("createPassenger allows same name if previous passenger is decommissioned", async () => {
    passengerRepo.findActiveByName.mockResolvedValue(null);
    passengerRepo.create.mockResolvedValue(passenger);

    await expect(
      service.createPassenger({
        name: "Ada Lovelace",
        password: "password123",
        membershipLevel: MembershipLevel.GOLD,
      }),
    ).resolves.toEqual(passenger);
  });

  it("createPassenger throws 400 if name, password or membershipLevel is missing", async () => {
    await expect(
      service.createPassenger({
        name: "",
        password: "password123",
        membershipLevel: MembershipLevel.GOLD,
      }),
    ).rejects.toThrow("Name, password and membershipLevel are required");

    await expect(
      service.createPassenger({
        name: "Ada Lovelace",
        password: "",
        membershipLevel: MembershipLevel.GOLD,
      }),
    ).rejects.toThrow("Name, password and membershipLevel are required");
  });

  it("findById returns passenger correctly", async () => {
    passengerRepo.findById.mockResolvedValue(passenger);

    await expect(service.getPassengerById("passenger-1")).resolves.toEqual(
      passenger,
    );
  });

  it("findById throws 404 when not found", async () => {
    passengerRepo.findById.mockResolvedValue(null);

    await expect(service.getPassengerById("missing")).rejects.toThrow(
      "Passenger not found",
    );
  });

  it("updatePassenger updates name", async () => {
    passengerRepo.findActiveByName.mockResolvedValue(null);
    passengerRepo.update.mockResolvedValue({ ...passenger, name: "Grace Hopper" });

    await expect(
      service.updatePassenger("passenger-1", { name: "Grace Hopper" }),
    ).resolves.toMatchObject({ name: "Grace Hopper" });
  });

  it("updatePassenger updates membershipLevel", async () => {
    passengerRepo.update.mockResolvedValue({
      ...passenger,
      membershipLevel: MembershipLevel.PLATINUM,
    });

    await expect(
      service.updatePassenger("passenger-1", {
        membershipLevel: MembershipLevel.PLATINUM,
      }),
    ).resolves.toMatchObject({ membershipLevel: MembershipLevel.PLATINUM });
  });

  it("updatePassenger throws 400 when no fields provided", async () => {
    await expect(service.updatePassenger("passenger-1", {})).rejects.toThrow(
      "At least one field required",
    );
  });

  it("updatePassenger throws 404 when not found", async () => {
    passengerRepo.update.mockResolvedValue(null);

    await expect(
      service.updatePassenger("missing", {
        membershipLevel: MembershipLevel.PLATINUM,
      }),
    ).rejects.toThrow("Passenger not found");
  });

  it("updatePassenger throws 409 on name conflict with another active passenger", async () => {
    passengerRepo.findActiveByName.mockResolvedValue({
      ...passenger,
      id: "passenger-2",
    });

    await expect(
      service.updatePassenger("passenger-1", { name: "Ada Lovelace" }),
    ).rejects.toThrow("Passenger with this name already exists");
  });

  it("decommissionPassenger sets isActive false", async () => {
    passengerRepo.findById.mockResolvedValue(passenger);
    passengerRepo.decommission.mockResolvedValue({
      ...passenger,
      isActive: false,
    });

    await expect(
      service.decommissionPassenger("passenger-1"),
    ).resolves.toMatchObject({ isActive: false });
  });

  it("decommissionPassenger throws 404 when not found", async () => {
    passengerRepo.findById.mockResolvedValue(null);

    await expect(
      service.decommissionPassenger("missing"),
    ).rejects.toThrow("Passenger not found");
  });

  it("decommissionPassenger throws 409 when already inactive", async () => {
    passengerRepo.findById.mockResolvedValue({
      ...passenger,
      isActive: false,
    });

    await expect(
      service.decommissionPassenger("passenger-1"),
    ).rejects.toThrow("Passenger is already decommissioned");
  });

  it("updateMembership non-existent throws passenger not found", async () => {
    passengerRepo.update.mockResolvedValue(null);

    await expect(
      service.updateMembership("missing", MembershipLevel.PLATINUM),
    ).rejects.toThrow("Passenger not found");
  });
});
