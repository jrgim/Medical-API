import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    next();
  };
};