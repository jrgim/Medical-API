import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { NotificationService } from "./notification.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { validate } from "../../server/middlewares/validation.middleware";

@Service()
export class NotificationController {
  private router = Router();

  constructor(private readonly notificationService: NotificationService) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const createNotificationValidation = [
      body("userId").notEmpty(),
      body("message").notEmpty(),
      validate,
    ];

    this.router.get("/", authenticateToken, this.getMyNotifications.bind(this));
    this.router.post("/send", authenticateToken, createNotificationValidation, this.create.bind(this));
    this.router.patch("/:id/read", authenticateToken, this.markAsRead.bind(this));
    this.router.delete("/:id", authenticateToken, this.delete.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await this.notificationService.getUserNotifications(
        (req as any).user.id
      );
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const notificationData = req.body;
      const notification = await this.notificationService.createNotification(
        notificationData
      );
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notification = await this.notificationService.markAsRead(
        parseInt(req.params.id as string)
      );
      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notificationService.deleteNotification(
        parseInt(req.params.id as string)
      );
      if (!result) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}