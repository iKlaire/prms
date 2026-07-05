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
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new PassengerService(passengerRepo);
  });

  it("creates a passenger and returns the domain shape", async () => {
    passengerRepo.create.mockResolvedValue(passenger);

    await expect(
      service.create({
        name: "Ada Lovelace",
        membershipLevel: MembershipLevel.GOLD,
      }),
    ).resolves.toEqual(passenger);
  });

  it("throws when findById cannot find a passenger", async () => {
    passengerRepo.findById.mockResolvedValue(null);

    await expect(service.findById("missing")).rejects.toThrow(
      "Passenger not found",
    );
  });

  it("throws when updateMembership cannot find a passenger", async () => {
    passengerRepo.update.mockResolvedValue(null);

    await expect(
      service.updateMembership("missing", MembershipLevel.PLATINUM),
    ).rejects.toThrow("Passenger not found");
  });
});
