import type { Response } from "express";

export const sendError = (res: Response, err: unknown): Response => {
  if (err instanceof Error) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("Access denied")) {
      return res.status(403).json({ error: err.message });
    }

    if (err.message.includes("decommissioned")) {
      return res.status(410).json({ error: err.message });
    }

    if (
      err.message.includes("required") ||
      err.message.includes("Invalid") ||
      err.message.includes("At least one")
    ) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal server error" });
};
