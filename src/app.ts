import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mission: "Spaceship X26 PRMS" });
});

// Routes mounted here as built
// app.use("/crew", crewRoutes);
// app.use("/passengers", passengerRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PRMS running on port ${PORT}`);
});

export default app;
