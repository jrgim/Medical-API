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
  next: NextFunction,
): Promise<void> {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    const userService = Container.get(UserService);
    const decoded = await userService.verifyToken(token);
    (req as any).userId = decoded.id;
    (req as any).role = decoded.role;
    (req as any).email = decoded.email;

    (req as any).user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}