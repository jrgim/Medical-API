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
      body("doctorId").isInt(),
      body("appointmentDate").isISO8601(),
      body("appointmentTime").matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
      body("reason").optional(),
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
      const user = (req as any).user;
      const criteria: any = { ...req.query };
      if (user.role === "patient") {
        const patient = await this.appointmentService.getPatientByUserId(
          user.id,
        );
        if (!patient) {
          res.status(404).json({ message: "Patient profile not found" });
          return;
        }
        criteria.patientId = patient.id;
      } else if (user.role === "doctor") {
        
        const doctor = await this.appointmentService.getDoctorByUserId(user.id);
        if (!doctor) {
          res.status(404).json({ message: "Doctor profile not found" });
          return;
        }
        criteria.doctorId = doctor.id;
      }

      const appointments =
        await this.appointmentService.getAppointments(criteria);
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const appointmentId = parseInt(req.params.id as string);

      const appointment =
        await this.appointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }

      if (user.role === "patient") {
        const patient = await this.appointmentService.getPatientByUserId(
          user.id,
        );
        if (!patient || appointment.patientId !== patient.id) {
          res
            .status(403)
            .json({
              message: "Access denied: You can only view your own appointments",
            });
          return;
        }
      } else if (user.role === "doctor") {
        const doctor = await this.appointmentService.getDoctorByUserId(user.id);
        if (!doctor || appointment.doctorId !== doctor.id) {
          res
            .status(403)
            .json({
              message: "Access denied: You can only view your own appointments",
            });
          return;
        }
      }
      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user || !user.id || !user.role) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      // If the user is a patient, use their own patientId
      // If they are a doctor/admin, they can specify patientId in the body
      let patientId = req.body.patientId;

      if (user.role === "patient") {
        const patientResult = await this.appointmentService.getPatientByUserId(
          user.id,
        );
        if (!patientResult) {
          res.status(404).json({ message: "Patient profile not found" });
          return;
        }
        patientId = patientResult.id;
      } else if (!patientId) {
        res
          .status(400)
          .json({ message: "patientId is required for admin/doctor" });
        return;
      }

      const appointment = await this.appointmentService.createAppointment({
        patientId,
        doctorId: req.body.doctorId,
        appointmentDate: req.body.appointmentDate,
        appointmentTime: req.body.appointmentTime,
        reason: req.body.reason,
      });

      await this.auditLogService.logAction(
        user.id,
        "CREATE",
        "appointment",
        appointment.id,
      );

      res.status(201).json(appointment);
    } catch (error: any) {
      if (
        error.message === "Slot already booked" ||
        error.message === "No availability slot found for this date and time"
      ) {
        res.status(409).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
    }
  }

  async reschedule(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { newDateTime, reason } = req.body;
      const appointmentId = parseInt(req.params.id as string);

      const existingAppointment =
        await this.appointmentService.getAppointmentById(appointmentId);
      if (!existingAppointment) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }

      if (user.role === "patient") {
        const patient = await this.appointmentService.getPatientByUserId(
          user.id,
        );
        if (!patient || existingAppointment.patientId !== patient.id) {
          res
            .status(403)
            .json({
              message:
                "Access denied: You can only reschedule your own appointments",
            });
          return;
        }
      } else if (user.role === "doctor") {
        res
          .status(403)
          .json({
            message: "Access denied: Doctors cannot reschedule appointments",
          });
        return;
      }

      const appointment = await this.appointmentService.rescheduleAppointment(
        appointmentId,
        newDateTime,
        reason,
      );

      await this.auditLogService.logAction(
        user.id,
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
      const user = (req as any).user;
      const { reason } = req.body;
      const appointmentId = parseInt(req.params.id as string);

      const existingAppointment =
        await this.appointmentService.getAppointmentById(appointmentId);
      if (!existingAppointment) {
        res.status(404).json({ message: "Appointment not found" });
        return;
      }

      if (user.role === "patient") {
        const patient = await this.appointmentService.getPatientByUserId(
          user.id,
        );
        if (!patient || existingAppointment.patientId !== patient.id) {
          res
            .status(403)
            .json({
              message:
                "Access denied: You can only cancel your own appointments",
            });
          return;
        }
      } else if (user.role === "doctor") {
        res
          .status(403)
          .json({
            message: "Access denied: Doctors cannot cancel appointments",
          });
        return;
      }
      const appointment = await this.appointmentService.cancelAppointment(
        appointmentId,
        reason,
      );

      await this.auditLogService.logAction(
        user.id,
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