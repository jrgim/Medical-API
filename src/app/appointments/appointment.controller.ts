import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { AppointmentService } from "./appointment.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";
import { AuditLogService } from "../audit/auditLog.service";

@Service()
export class AppointmentController {
  private router = Router();

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const createAppointmentValidation = [
      body("patientId").notEmpty(),
      body("doctorId").notEmpty(),
      body("dateTime").isISO8601(),
      body("reason").notEmpty(),
      validate,
    ];

    const rescheduleValidation = [
      body("newDateTime").isISO8601(),
      body("reason").optional(),
      validate,
    ];

    const cancelValidation = [body("reason").optional(), validate];

    this.router.get("/", authenticateToken, this.getAll.bind(this));
    this.router.post("/",authenticateToken, createAppointmentValidation, this.create.bind(this));
    this.router.get("/:id", authenticateToken, this.getById.bind(this));
    this.router.patch("/:id/reschedule", authenticateToken, rescheduleValidation, this.reschedule.bind(this));
    this.router.patch("/:id/cancel", authenticateToken, cancelValidation, this.cancel.bind(this));
    this.router.delete("/:id", authenticateToken, authorizeRole(["admin"]), this.delete.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const appointments = await this.appointmentService.getAppointments(
        req.query,
      );
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await this.appointmentService.getAppointmentById(
        parseInt(req.params.id as string),
      );
      if (!appointment) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }
      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await this.appointmentService.createAppointment(
        req.body,
      );

      await this.auditLogService.logAction(
        (req as any).user.id,
        "CREATE",
        "appointment",
        appointment.id,
      );

      res.status(201).json(appointment);
    } catch (error: any) {
      if (
        error.message === "Slot already booked" ||
        error.message === "No availability slot found for this time"
      ) {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
    }
  }

  async reschedule(req: Request, res: Response): Promise<void> {
    try {
      const { newDateTime, reason } = req.body;
      const appointmentId = parseInt(req.params.id as string);
      const appointment = await this.appointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime,
        reason,
      );
      if (!appointment) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }

      await this.auditLogService.logAction(
        (req as any).user.id,
        "RESCHEDULE",
        "appointment",
        appointmentId,
      );

      res.json(appointment);
    } catch (error: any) {
      if (
        error.message.includes("not available") ||
        error.message.includes("already booked")
      ) {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      const appointmentId = parseInt(req.params.id as string);
      const appointment = await this.appointmentService.cancelAppointment(
        appointmentId,
        reason,
      );
      if (!appointment) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }

      await this.auditLogService.logAction(
        (req as any).user.id,
        "CANCEL",
        "appointment",
        appointmentId,
      );

      res.json(appointment);
    } catch (error: any) {
      if (error.message.includes("cannot be cancelled")) {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.appointmentService.deleteAppointment(
        parseInt(req.params.id as string),
      );
      if (!result) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}