import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { UserService } from "./user.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";

@Service()
export class UserController {
  private router = Router();

  constructor(private readonly userService: UserService) {
    this.router.get("/", authenticateToken, authorizeRole(["admin"]), this.getAllUsers.bind(this));
    this.router.get("/search", authenticateToken, authorizeRole(["admin"]), this.searchUsers.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers(req.query);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { query, role } = req.query;
      if (!query) {
        res.status(400).json({ message: "Query parameter is required" });
        return;
      }
      const users = await this.userService.searchUsers(
        query as string,
        role as string
      );
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}