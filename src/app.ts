import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import crewRoutes from "./routes/crewRoutes";
import passengerRoutes from "./routes/passengerRoutes";

dotenv.config();

export const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", mission: "Spaceship X26 PRMS" });
  });

  app.use("/auth", authRoutes);
  app.use("/crew", crewRoutes);
  app.use("/passengers", passengerRoutes);

  app.use("/api/auth", authRoutes);
  app.use("/api/crew", crewRoutes);
  app.use("/api/passengers", passengerRoutes);

  return app;
};

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`PRMS running on port ${PORT}`);
  });
}

export default app;
