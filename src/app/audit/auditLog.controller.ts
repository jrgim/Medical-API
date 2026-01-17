import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { AuditLogService } from "./auditLog.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";

@Service()
export class AuditLogController {
  private router = Router();

  constructor(private readonly auditLogService: AuditLogService) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(authenticateToken);
    this.router.use(authorizeRole(["admin"]));

    this.router.get("/", this.getAll.bind(this));
    this.router.get("/:id", this.getById.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const logs = await this.auditLogService.getAuditLogs(req.query);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const log = await this.auditLogService.getAuditLogById(parseInt(req.params.id as string));
      if (!log) {
        res.status(404).json({ message: "Log entry not found" });
        return;
      }
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}