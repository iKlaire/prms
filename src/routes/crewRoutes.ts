import type { RequestHandler } from "express";
import { Router } from "express";
import { MembershipLevel } from "../domain/passenger";
import { crewLeadOnly } from "../middleware/auth";
import { PassengerRepository } from "../repositories/passengerRepository";
import { ResourceRepository } from "../repositories/resourceRepository";
import { UsageLogRepository } from "../repositories/usageLogRepository";
import { PassengerService } from "../services/passengerService";
import { ResourceService } from "../services/resourceService";
import { UsageService } from "../services/usageService";
import { sendError } from "./http";

interface CreatePassengerBody {
  name?: string;
  password?: string;
  membershipLevel?: MembershipLevel;
}

interface UpdatePassengerBody {
  name?: string;
  membershipLevel?: MembershipLevel;
}

interface CreateResourceBody {
  name?: string;
  minimumLevel?: MembershipLevel;
}

interface UpdateResourceBody {
  name?: string;
  minimumLevel?: MembershipLevel;
}

export const createCrewRoutes = (
  passengerService: PassengerService,
  resourceService: ResourceService,
  usageService: UsageService,
  authMiddleware: RequestHandler = crewLeadOnly,
): Router => {
  const router = Router();

  router.use(authMiddleware);

  router.post("/passengers", async (req, res) => {
    const body = req.body as CreatePassengerBody;

    try {
      const passenger = await passengerService.create({
        name: body.name ?? "",
        password: body.password ?? "",
        membershipLevel: body.membershipLevel as MembershipLevel,
      });
      res.status(201).json(passenger);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/passengers", async (_req, res) => {
    const passengers = await passengerService.findAll();
    res.status(200).json(passengers);
  });

  router.patch("/passengers/:id", async (req, res) => {
    const body = req.body as UpdatePassengerBody;

    try {
      const passenger = await passengerService.update(req.params.id, {
        name: body.name,
        membershipLevel: body.membershipLevel,
      });
      res.status(200).json(passenger);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.delete("/passengers/:id", async (req, res) => {
    try {
      await passengerService.decommissionPassenger(req.params.id);
      res.status(200).json({ message: "Passenger decommissioned" });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/resources", async (req, res) => {
    const body = req.body as CreateResourceBody;

    try {
      const resource = await resourceService.provision({
        name: body.name ?? "",
        minimumLevel: body.minimumLevel as MembershipLevel,
      });
      res.status(201).json(resource);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/resources", async (_req, res) => {
    const resources = await resourceService.findAll();
    res.status(200).json(resources);
  });

  router.patch("/resources/:id", async (req, res) => {
    const body = req.body as UpdateResourceBody;

    try {
      const resource = await resourceService.updateResource(req.params.id, {
        name: body.name,
        minimumLevel: body.minimumLevel,
      });
      res.status(200).json(resource);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.delete("/resources/:id", async (req, res) => {
    try {
      await resourceService.decommission(req.params.id);
      res.status(200).json({ message: "Resource decommissioned" });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/resources/:id/reactivate", async (req, res) => {
    try {
      await resourceService.reactivateResource(req.params.id);
      res.status(200).json({ message: "Resource reactivated" });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/reports/usage", async (_req, res) => {
    const usage = await usageService.findAllUsage();
    res.status(200).json(usage);
  });

  router.get("/reports/by-level", async (_req, res) => {
    const usage = await usageService.aggregateByLevel();
    res.status(200).json(usage);
  });

  router.get("/reports/top-resources", async (_req, res) => {
    const usage = await usageService.topResources();
    res.status(200).json(usage);
  });

  return router;
};

const passengerRepo = new PassengerRepository();
const resourceRepo = new ResourceRepository();
const usageLogRepo = new UsageLogRepository();

export default createCrewRoutes(
  new PassengerService(passengerRepo),
  new ResourceService(resourceRepo),
  new UsageService(usageLogRepo, passengerRepo, resourceRepo),
);
