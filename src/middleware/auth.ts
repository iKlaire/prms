import type { NextFunction, Request, Response } from "express";
import type { CrewLead } from "../domain/crewLead";
import type { Passenger } from "../domain/passenger";
import { CrewLeadRepository } from "../repositories/crewLeadRepository";
import { PassengerRepository } from "../repositories/passengerRepository";
import { AuthTokenService } from "../services/authTokenService";

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

const extractBearerToken = (
  value: string | string[] | undefined,
): string | null => {
  const authorization = extractHeader(value);
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const createCrewLeadOnly = (
  crewLeadRepo: Pick<CrewLeadRepository, "findById"> = new CrewLeadRepository(),
  tokenService: AuthTokenService = new AuthTokenService(),
) => {
  return async (
    req: Request,
    res: Response<unknown, AuthenticatedLocals>,
    next: NextFunction,
  ): Promise<void> => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const payload = tokenService.verify(token);
    if (!payload || payload.role !== "crew") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const crewLead = await crewLeadRepo.findById(payload.sub);
    if (!crewLead) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.locals.crewLead = crewLead;
    next();
  };
};

export const createPassengerAuth = (
  passengerRepo: Pick<
    PassengerRepository,
    "findById"
  > = new PassengerRepository(),
  tokenService: AuthTokenService = new AuthTokenService(),
) => {
  return async (
    req: Request,
    res: Response<unknown, AuthenticatedLocals>,
    next: NextFunction,
  ): Promise<void> => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const payload = tokenService.verify(token);
    if (!payload || payload.role !== "passenger") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const passenger = await passengerRepo.findById(payload.sub);
    if (!passenger) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!passenger.isActive) {
      res.status(403).json({ error: "Account decommissioned" });
      return;
    }

    res.locals.passenger = passenger;
    next();
  };
};

export const crewLeadOnly = createCrewLeadOnly();
export const passengerAuth = createPassengerAuth();
