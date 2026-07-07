import bcrypt from "bcrypt";
import express from "express";
import request from "supertest";
import type { RequestHandler } from "express";
import { createApp } from "../src/app";
import type { CrewLead } from "../src/domain/crewLead";
import { MembershipLevel, Passenger } from "../src/domain/passenger";
import { Resource } from "../src/domain/resource";
import { createCrewLeadOnly, createPassengerAuth } from "../src/middleware/auth";
import type { CrewLeadRepository } from "../src/repositories/crewLeadRepository";
import type { PassengerRepository } from "../src/repositories/passengerRepository";
import { createAuthRoutes } from "../src/routes/authRoutes";
import { createCrewRoutes } from "../src/routes/crewRoutes";
import { createPassengerRoutes } from "../src/routes/passengerRoutes";
import type {
  AuthCrewLeadStore,
  AuthPassengerStore,
} from "../src/services/authService";
import {
  AuthService,
} from "../src/services/authService";
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

const crewLead: CrewLead = {
  id: "crew-1",
  name: "Ali",
  createdAt: now,
};

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

describe("app", () => {
  it("exposes a health check", async () => {
    const app = createApp();

    await request(app)
      .get("/health")
      .expect(200)
      .expect({
        status: "ok",
        mission: "Spaceship X26 PRMS",
      });
  });

  it("protects crew routes when the crew header is missing", async () => {
    const app = createApp();

    await request(app)
      .get("/crew/passengers")
      .expect(403)
      .expect({ error: "Forbidden" });
  });

  it("protects passenger routes when the passenger header is missing", async () => {
    const app = createApp();

    await request(app)
      .get("/passengers/resources")
      .expect(403)
      .expect({ error: "Forbidden" });
  });
});

describe("auth routes", () => {
  let crewLeadRepo: jest.Mocked<AuthCrewLeadStore>;
  let passengerRepo: jest.Mocked<AuthPassengerStore>;
  let app: express.Express;

  beforeEach(() => {
    crewLeadRepo = {
      findByNameWithPassword: jest.fn(),
    };
    passengerRepo = {
      findByNameWithPassword: jest.fn(),
    };

    app = express();
    app.use(express.json());
    app.use(
      "/auth",
      createAuthRoutes(new AuthService(crewLeadRepo, passengerRepo)),
    );
  });

  it("logs in a crew lead and returns only the ID", async () => {
    crewLeadRepo.findByNameWithPassword.mockResolvedValue({
      ...crewLead,
      password: await bcrypt.hash("password123", 4),
    });

    const response = await request(app)
      .post("/auth/crew/login")
      .send({ name: " Ali ", password: "password123" })
      .expect(200);

    expect(response.body).toEqual({ crewLeadId: crewLead.id });
    expect(response.body).not.toHaveProperty("password");
    expect(crewLeadRepo.findByNameWithPassword).toHaveBeenCalledWith("Ali");
  });

  it("rejects invalid crew lead credentials", async () => {
    crewLeadRepo.findByNameWithPassword.mockResolvedValue(null);

    await request(app)
      .post("/auth/crew/login")
      .send({ name: "Ali", password: "wrong" })
      .expect(401)
      .expect({ error: "Invalid credentials" });
  });

  it("logs in a passenger and returns only the ID", async () => {
    passengerRepo.findByNameWithPassword.mockResolvedValue({
      ...passenger,
      password: await bcrypt.hash("password123", 4),
    });

    const response = await request(app)
      .post("/auth/passenger/login")
      .send({ name: passenger.name, password: "password123" })
      .expect(200);

    expect(response.body).toEqual({ passengerId: passenger.id });
    expect(response.body).not.toHaveProperty("password");
  });
});

describe("auth middleware", () => {
  it("attaches a valid crew lead to protected routes", async () => {
    const crewLeadRepo = {
      findById: jest.fn().mockResolvedValue(crewLead),
    } as unknown as CrewLeadRepository;
    const app = express();

    app.get(
      "/protected",
      createCrewLeadOnly(crewLeadRepo),
      (_req, res) => res.status(200).json({ crewLead: res.locals.crewLead }),
    );

    const response = await request(app)
      .get("/protected")
      .set("x-crew-lead-id", crewLead.id)
      .expect(200);

    expect(response.body.crewLead).toMatchObject({
      id: crewLead.id,
      name: crewLead.name,
    });
  });

  it("rejects unknown crew lead headers", async () => {
    const crewLeadRepo = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as CrewLeadRepository;
    const app = express();

    app.get(
      "/protected",
      createCrewLeadOnly(crewLeadRepo),
      (_req, res) => res.status(200).json({ ok: true }),
    );

    await request(app)
      .get("/protected")
      .set("x-crew-lead-id", "missing")
      .expect(403)
      .expect({ error: "Forbidden" });
  });

  it("rejects decommissioned passenger accounts", async () => {
    const passengerRepo = {
      findById: jest.fn().mockResolvedValue({
        ...passenger,
        isActive: false,
      }),
    } as unknown as PassengerRepository;
    const app = express();

    app.get(
      "/protected",
      createPassengerAuth(passengerRepo),
      (_req, res) => res.status(200).json({ ok: true }),
    );

    await request(app)
      .get("/protected")
      .set("x-passenger-id", passenger.id)
      .expect(403)
      .expect({ error: "Account decommissioned" });
  });
});

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
