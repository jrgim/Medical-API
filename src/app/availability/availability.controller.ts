import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { AvailabilityService } from "./availability.service";
import { DoctorRepository } from "../doctors/doctor.repository";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";

@Service()
export class AvailabilityController {
  private router = Router();

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly doctorRepository: DoctorRepository,
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get("/doctors/:doctorId", this.getAvailability.bind(this));
    this.router.post(
      "/",
      authenticateToken,
      authorizeRole(["doctor", "admin"]),
      this.createAvailability.bind(this),
    );
    this.router.put(
      "/:slotId",
      authenticateToken,
      authorizeRole(["doctor", "admin"]),
      this.updateSlot.bind(this),
    );
    this.router.delete(
      "/:slotId",
      authenticateToken,
      authorizeRole(["doctor", "admin"]),
      this.deleteSlot.bind(this),
    );
  }

  getRouter(): Router {
    return this.router;
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      const doctorId = parseInt(req.params.doctorId as string);
      const availability = await this.availabilityService.getDoctorAvailability(
        doctorId,
        date as string,
      );
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async createAvailability(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const doctorProfile = await this.doctorRepository.findByUserId(user.id);
      if (!doctorProfile || !doctorProfile.id) {
        res.status(404).json({
          message: "Doctor profile not found for this user",
        });
        return;
      }

      if (!Array.isArray(req.body)) {
        res.status(400).json({
          message: "Request body must be an array of availability slots",
        });
        return;
      }

      const result = await this.availabilityService.setAvailability(
        doctorProfile.id,
        req.body,
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateSlot(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const slotId = parseInt(req.params.slotId as string);

      if (user.role === "doctor") {
        const doctorProfile = await this.doctorRepository.findByUserId(user.id);
        if (!doctorProfile || !doctorProfile.id) {
          res.status(404).json({ message: "Doctor profile not found" });
          return;
        }

        const existingSlots =
          await this.availabilityService.getDoctorAvailability(
            doctorProfile.id,
          );
        const slotBelongsToDoctor = existingSlots.some((s) => s.id === slotId);

        if (!slotBelongsToDoctor) {
          res.status(403).json({
            message: "Access denied: You can only manage your own availability",
          });
          return;
        }
      }

      const slot = await this.availabilityService.updateSlot(slotId, req.body);
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
      const user = (req as any).user;
      const slotId = parseInt(req.params.slotId as string);

      if (user.role === "doctor") {
        const doctorProfile = await this.doctorRepository.findByUserId(user.id);
        if (!doctorProfile || !doctorProfile.id) {
          res.status(404).json({ message: "Doctor profile not found" });
          return;
        }

        const existingSlots =
          await this.availabilityService.getDoctorAvailability(
            doctorProfile.id,
          );
        const slotBelongsToDoctor = existingSlots.some((s) => s.id === slotId);

        if (!slotBelongsToDoctor) {
          res.status(403).json({
            message: "Access denied: You can only manage your own availability",
          });
          return;
        }
      }

      const result = await this.availabilityService.deleteSlot(slotId);
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