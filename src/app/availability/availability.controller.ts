import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { AvailabilityService } from "./availability.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";

@Service()
export class AvailabilityController {
  private router = Router();

  constructor(private readonly availabilityService: AvailabilityService) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get("/doctors/:id/availability", this.getAvailability.bind(this));
    this.router.post("/doctors/:id/availability", authenticateToken, authorizeRole(["doctor", "admin"]), this.setAvailability.bind(this));
    this.router.put("/doctors/:id/availability/:slotId", authenticateToken, authorizeRole(["doctor", "admin"]), this.updateSlot.bind(this));
    this.router.delete("/doctors/:id/availability/:slotId", authenticateToken, authorizeRole(["doctor", "admin"]), this.deleteSlot.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      const availability = await this.availabilityService.getDoctorAvailability(
        parseInt(req.params.id as string),
        date as string,
      );
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async setAvailability(req: Request, res: Response): Promise<void> {
    try {
      const slots = await this.availabilityService.setAvailability(
        parseInt(req.params.id as string),
        req.body.slots,
      );
      res.status(201).json(slots);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateSlot(req: Request, res: Response): Promise<void> {
    try {
      const slot = await this.availabilityService.updateSlot(
        parseInt(req.params.slotId as string),
        req.body,
      );
      if (!slot) {
        res.status(404).json({ message: "Slot not found" });
        return;
      }
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteSlot(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.availabilityService.deleteSlot(
        parseInt(req.params.slotId as string),
      );
      if (!result) {
        res.status(404).json({ message: "Slot not found" });
        return;
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}