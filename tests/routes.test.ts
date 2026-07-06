import express from "express";
import request from "supertest";
import type { RequestHandler } from "express";
import { MembershipLevel, Passenger } from "../src/domain/passenger";
import { Resource } from "../src/domain/resource";
import { createCrewRoutes } from "../src/routes/crewRoutes";
import { createPassengerRoutes } from "../src/routes/passengerRoutes";
import {
  PassengerService,
  PassengerStore,
} from "../src/services/passengerService";
import {
  ResourceService,
  ResourceStore,
} from "../src/services/resourceService";
import {
  UsageLogStore,
  UsagePassengerStore,
  UsageResourceStore,
  UsageService,
} from "../src/services/usageService";

const now = new Date("2026-01-01T00:00:00Z");

const passenger: Passenger = {
  id: "passenger-1",
  name: "Mae Jemison",
  membershipLevel: MembershipLevel.GOLD,
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const resource: Resource = {
  id: "resource-1",
  name: "Sleep Pod",
  minimumLevel: MembershipLevel.SILVER,
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const passThroughCrewAuth: RequestHandler = (_req, _res, next) => {
  next();
};

const passengerAuth: RequestHandler = (_req, res, next) => {
  res.locals.passenger = passenger;
  next();
};

describe("routes", () => {
  let passengerRepo: jest.Mocked<PassengerStore>;
  let resourceRepo: jest.Mocked<
    ResourceStore & UsageResourceStore
  >;
  let usageLogRepo: jest.Mocked<UsageLogStore>;
  let usagePassengerRepo: jest.Mocked<UsagePassengerStore>;
  let app: express.Express;

  beforeEach(() => {
    passengerRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      update: jest.fn(),
      decommission: jest.fn(),
    };
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
    usageLogRepo = {
      create: jest.fn(),
      findByPassengerIdWithDetails: jest.fn(),
      findAllWithDetails: jest.fn(),
      aggregateByLevel: jest.fn(),
      topResources: jest.fn(),
    };
    usagePassengerRepo = {
      findById: jest.fn(),
    };

    const passengerService = new PassengerService(passengerRepo);
    const resourceService = new ResourceService(resourceRepo);
    const usageService = new UsageService(
      usageLogRepo,
      usagePassengerRepo,
      resourceRepo,
    );

    app = express();
    app.use(express.json());
    app.use(
      "/crew",
      createCrewRoutes(
        passengerService,
        resourceService,
        usageService,
        passThroughCrewAuth,
      ),
    );
    app.use(
      "/passengers",
      createPassengerRoutes(resourceService, usageService, passengerAuth),
    );
  });

  it("creates a passenger through the crew route", async () => {
    passengerRepo.findActiveByName.mockResolvedValue(null);
    passengerRepo.create.mockResolvedValue(passenger);

    const response = await request(app)
      .post("/crew/passengers")
      .send({
        name: passenger.name,
        password: "password123",
        membershipLevel: passenger.membershipLevel,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: passenger.id,
      name: passenger.name,
      membershipLevel: passenger.membershipLevel,
    });
  });

  it("maps crew validation errors to 400", async () => {
    const response = await request(app)
      .patch("/crew/passengers/passenger-1")
      .send({})
      .expect(400);

    expect(response.body).toEqual({ error: "At least one field required" });
  });

  it("lists passenger-accessible resources", async () => {
    resourceRepo.findActiveByMinimumLevels.mockResolvedValue([resource]);

    const response = await request(app)
      .get("/passengers/resources")
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(resourceRepo.findActiveByMinimumLevels).toHaveBeenCalledWith([
      MembershipLevel.SILVER,
      MembershipLevel.GOLD,
    ]);
  });

  it("maps passenger access denials to 403", async () => {
    usagePassengerRepo.findById.mockResolvedValue({
      id: passenger.id,
      membershipLevel: MembershipLevel.SILVER,
    });
    resourceRepo.findById.mockResolvedValue({
      ...resource,
      minimumLevel: MembershipLevel.GOLD,
    });

    const response = await request(app)
      .post("/passengers/resources/resource-1/use")
      .expect(403);

    expect(response.body).toEqual({
      error: "Access denied. Insufficient membership level",
    });
  });
});
