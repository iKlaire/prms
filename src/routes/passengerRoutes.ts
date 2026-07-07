import type { RequestHandler, Response } from "express";
import { Router } from "express";
import type { Passenger } from "../domain/passenger";
import { NotFoundError } from "../errors";
import {
  AuthenticatedLocals,
  passengerAuth,
} from "../middleware/auth";
import { PassengerRepository } from "../repositories/passengerRepository";
import { ResourceRepository } from "../repositories/resourceRepository";
import { UsageLogRepository } from "../repositories/usageLogRepository";
import { ResourceService } from "../services/resourceService";
import { UsageService } from "../services/usageService";
import { sendError } from "./http";

const getPassenger = (
  res: Response<unknown, AuthenticatedLocals>,
): Passenger => {
  if (!res.locals.passenger) {
    throw new NotFoundError("Passenger not found");
  }

  return res.locals.passenger;
};

export const createPassengerRoutes = (
  resourceService: ResourceService,
  usageService: UsageService,
  authMiddleware: RequestHandler = passengerAuth,
): Router => {
  const router = Router();

  router.use(authMiddleware);

  router.get("/resources", async (_req, res: Response<unknown, AuthenticatedLocals>) => {
    try {
      const passenger = getPassenger(res);
      const resources = await resourceService.findAccessibleByLevel(
        passenger.membershipLevel,
      );
      res.status(200).json(resources);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post(
    "/resources/:id/use",
    async (req, res: Response<unknown, AuthenticatedLocals>) => {
      try {
        const passenger = getPassenger(res);
        const log = await usageService.useResource(passenger.id, req.params.id);
        res.status(201).json({ message: "Resource accessed", log });
      } catch (err) {
        sendError(res, err);
      }
    },
  );

  router.get("/usage", async (_req, res: Response<unknown, AuthenticatedLocals>) => {
    try {
      const passenger = getPassenger(res);
      const usage = await usageService.findPassengerUsage(passenger.id);
      res.status(200).json(usage);
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
};

const passengerRepo = new PassengerRepository();
const resourceRepo = new ResourceRepository();
const usageLogRepo = new UsageLogRepository();

export default createPassengerRoutes(
  new ResourceService(resourceRepo),
  new UsageService(usageLogRepo, passengerRepo, resourceRepo),
);
