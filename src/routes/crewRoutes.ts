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
import {
  validateCreatePassengerBody,
  validateCreateResourceBody,
  validateUpdatePassengerBody,
  validateUpdateResourceBody,
} from "./validation";

export const createCrewRoutes = (
  passengerService: PassengerService,
  resourceService: ResourceService,
  usageService: UsageService,
  authMiddleware: RequestHandler = crewLeadOnly,
): Router => {
  const router = Router();

  router.use(authMiddleware);

  router.post("/passengers", async (req, res) => {
    try {
      const passenger = await passengerService.create(
        validateCreatePassengerBody(req.body),
      );
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
    try {
      const passenger = await passengerService.update(
        req.params.id,
        validateUpdatePassengerBody(req.body),
      );
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
    try {
      const resource = await resourceService.provision(
        validateCreateResourceBody(req.body),
      );
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
    try {
      const resource = await resourceService.updateResource(
        req.params.id,
        validateUpdateResourceBody(req.body),
      );
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
