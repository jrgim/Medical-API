import { Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import { UserService } from "../../app/users/user.service";

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
  email?: string;
  role?: string;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    // Verificar token usando UserService
    const userService = Container.get(UserService);
    const decoded = await userService.verifyToken(token);

    // Añadir información del usuario a la request
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.email = decoded.email;
    req.role = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}