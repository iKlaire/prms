import type { Response } from "express";
import { AppError } from "../errors";

export const sendError = (res: Response, err: unknown): Response => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal server error" });
};
