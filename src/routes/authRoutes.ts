import { Router } from "express";
import { CrewLeadRepository } from "../repositories/crewLeadRepository";
import { PassengerRepository } from "../repositories/passengerRepository";
import { AuthService } from "../services/authService";

interface LoginBody {
  name?: string;
  password?: string;
}

export const createAuthRoutes = (authService: AuthService): Router => {
  const router = Router();

  router.post("/crew/login", async (req, res) => {
    const { name = "", password = "" } = req.body as LoginBody;

    try {
      const crewLead = await authService.loginCrewLead(name, password);
      res.status(200).json({ crewLeadId: crewLead.id });
    } catch {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  router.post("/passenger/login", async (req, res) => {
    const { name = "", password = "" } = req.body as LoginBody;

    try {
      const passenger = await authService.loginPassenger(name, password);
      res.status(200).json({ passengerId: passenger.id });
    } catch {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  return router;
};

const authService = new AuthService(
  new CrewLeadRepository(),
  new PassengerRepository(),
);

export default createAuthRoutes(authService);
