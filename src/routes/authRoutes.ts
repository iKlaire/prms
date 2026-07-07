import { Router } from "express";
import { CrewLeadRepository } from "../repositories/crewLeadRepository";
import { PassengerRepository } from "../repositories/passengerRepository";
import { AuthService } from "../services/authService";
import { sendError } from "./http";
import { validateLoginBody } from "./validation";

export const createAuthRoutes = (authService: AuthService): Router => {
  const router = Router();

  router.post("/crew/login", async (req, res) => {
    try {
      const { name, password } = validateLoginBody(req.body);
      const session = await authService.loginCrewLead(name, password);
      res.status(200).json({
        token: session.token,
        crewLead: session.user,
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/passenger/login", async (req, res) => {
    try {
      const { name, password } = validateLoginBody(req.body);
      const session = await authService.loginPassenger(name, password);
      res.status(200).json({
        token: session.token,
        passenger: session.user,
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
};

const authService = new AuthService(
  new CrewLeadRepository(),
  new PassengerRepository(),
);

export default createAuthRoutes(authService);
