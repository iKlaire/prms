import type { NextFunction, Request, Response } from "express";
import type { CrewLead } from "../domain/crewLead";
import type { Passenger } from "../domain/passenger";
import { CrewLeadRepository } from "../repositories/crewLeadRepository";
import { PassengerRepository } from "../repositories/passengerRepository";

export interface AuthenticatedLocals {
  crewLead?: CrewLead;
  passenger?: Passenger;
}

const extractHeader = (value: string | string[] | undefined): string | null => {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] : value;
};

export const createCrewLeadOnly = (
  crewLeadRepo: CrewLeadRepository = new CrewLeadRepository(),
) => {
  return async (
    req: Request,
    res: Response<unknown, AuthenticatedLocals>,
    next: NextFunction,
  ): Promise<void> => {
    const crewLeadId = extractHeader(req.headers["x-crew-lead-id"]);
    if (!crewLeadId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const crewLead = await crewLeadRepo.findById(crewLeadId);
    if (!crewLead) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.locals.crewLead = crewLead;
    next();
  };
};

export const createPassengerAuth = (
  passengerRepo: PassengerRepository = new PassengerRepository(),
) => {
  return async (
    req: Request,
    res: Response<unknown, AuthenticatedLocals>,
    next: NextFunction,
  ): Promise<void> => {
    const passengerId = extractHeader(req.headers["x-passenger-id"]);
    if (!passengerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const passenger = await passengerRepo.findById(passengerId);
    if (!passenger) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.locals.passenger = passenger;
    next();
  };
};

export const crewLeadOnly = createCrewLeadOnly();
export const passengerAuth = createPassengerAuth();
