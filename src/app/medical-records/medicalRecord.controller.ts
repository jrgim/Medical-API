import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { MedicalRecordService } from "./medicalRecord.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";
import { AuditLogService } from "../audit/auditLog.service";
import { PatientRepository } from "../patients/patient.repository";
import { DoctorRepository } from "../doctors/doctor.repository";

@Service()
export class MedicalRecordController {
  private router = Router();

  constructor(
    private readonly medicalRecordService: MedicalRecordService,
    private readonly auditLogService: AuditLogService,
    private readonly patientRepository: PatientRepository,
    private readonly doctorRepository: DoctorRepository,
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const createRecordValidation = [
      body("patientId").notEmpty(),
      body("diagnosis").notEmpty(),
      validate,
    ];

    const testResultValidation = [
      body("testType").notEmpty(),
      body("result").notEmpty(),
      body("date").optional().isISO8601(),
      validate,
    ];

    const treatmentValidation = [
      body("name").notEmpty(),
      body("details").optional(),
      body("startDate").isISO8601(),
      body("status").optional().isIn(["ongoing", "completed", "discontinued"]),
      validate,
    ];

    const treatmentUpdateValidation = [
      body("details").optional(),
      body("status").optional().isIn(["ongoing", "completed", "discontinued"]),
      validate,
    ];

    this.router.get("/", authenticateToken, this.getAll.bind(this));
    this.router.post("/", authenticateToken, authorizeRole(["doctor", "admin"]), createRecordValidation, this.create.bind(this));
    this.router.get("/:id", authenticateToken, this.getById.bind(this));
    this.router.patch("/:id", authenticateToken, authorizeRole(["doctor", "admin"]), this.update.bind(this));
    this.router.delete("/:id", authenticateToken, authorizeRole(["admin"]), this.delete.bind(this));

    this.router.post("/:id/test-results", authenticateToken, authorizeRole(["doctor", "admin"]), testResultValidation, this.addTestResult.bind(this));

    this.router.post("/:id/treatments", authenticateToken, authorizeRole(["doctor", "admin"]), treatmentValidation, this.addTreatment.bind(this));
    this.router.patch("/:id/treatments/:treatmentId", authenticateToken, authorizeRole(["doctor", "admin"]), treatmentUpdateValidation, this.updateTreatment.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const criteria: any = { ...req.query };

      if (user.role === "patient") {
        const patient = await this.patientRepository.findByUserId(user.id);
        if (!patient) {
          res.status(404).json({ message: "Patient profile not found" });
          return;
        }
        criteria.patientId = patient.id;
      } else if (user.role === "doctor") {

        const doctor = await this.doctorRepository.findByUserId(user.id);
        if (!doctor) {
          res.status(404).json({ message: "Doctor profile not found" });
          return;
        }
        criteria.doctorId = doctor.id;
      }

      const records =
        await this.medicalRecordService.getAllMedicalRecords(criteria);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const recordId = parseInt(req.params.id as string);

      const record =
        await this.medicalRecordService.getMedicalRecordById(recordId);
      if (!record) {
        res.status(404).json({ message: "Medical Record not found" });
        return;
      }

      if (user.role === "patient") {
        const patient = await this.patientRepository.findByUserId(user.id);
        if (!patient || record.patientId !== patient.id) {
          res.status(403).json({
            message:
              "Access denied: You can only view your own medical records",
          });
          return;
        }
      } else if (user.role === "doctor") {
        const doctor = await this.doctorRepository.findByUserId(user.id);
        if (!doctor || record.doctorId !== doctor.id) {
          res.status(403).json({
            message:
              "Access denied: You can only view medical records you created",
          });
          return;
        }
      }
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const patientId = req.body.patientId;

      if (user.role === "doctor") {
        const doctor = await this.doctorRepository.findByUserId(user.id);
        if (!doctor || !doctor.id) {
          res.status(404).json({ message: "Doctor profile not found" });
          return;
        }
        const appointments =
          await this.medicalRecordService.getAppointmentsByDoctorAndPatient(
            doctor.id,
            patientId,
          );
        if (appointments.length === 0) {
          res.status(403).json({
            message:
              "Access denied: You can only create records for patients you have appointments with",
          });
          return;
        }
        req.body.doctorId = doctor.id;
      }

      const record = await this.medicalRecordService.createMedicalRecord(
        req.body,
      );

      await this.auditLogService.logAction(
        user.id,
        "CREATE",
        "medicalRecord",
        record.id,
      );

      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const recordId = parseInt(req.params.id as string);
      const existingRecord =
        await this.medicalRecordService.getMedicalRecordById(recordId);
      if (!existingRecord) {
        res.status(404).json({ message: "Medical Record not found" });
        return;
      }

      if (user.role === "doctor") {
        const doctor = await this.doctorRepository.findByUserId(user.id);
        if (!doctor || existingRecord.doctorId !== doctor.id) {
          res.status(403).json({
            message:
              "Access denied: You can only update medical records you created",
          });
          return;
        }
      }

      const record = await this.medicalRecordService.updateMedicalRecord(
        recordId,
        req.body,
      );

      await this.auditLogService.logAction(
        user.id,
        "UPDATE",
        "medicalRecord",
        recordId,
      );

      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const recordId = parseInt(req.params.id as string);
      const result =
        await this.medicalRecordService.deleteMedicalRecord(recordId);
      if (!result) {
        res.status(404).json({ message: "Medical Record not found" });
        return;
      }

      await this.auditLogService.logAction(
        (req as any).user.id,
        "DELETE",
        "medicalRecord",
        recordId,
      );

      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async addTestResult(req: Request, res: Response): Promise<void> {
    try {
      const recordId = parseInt(req.params.id as string);
      const testResult = await this.medicalRecordService.addTestResult(
        recordId,
        req.body,
      );
      res.status(201).json(testResult);
    } catch (error: any) {
      if (error.message === "Medical Record not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
    }
  }

  async addTreatment(req: Request, res: Response): Promise<void> {
    try {
      const recordId = parseInt(req.params.id as string);
      const treatment = await this.medicalRecordService.addTreatment(
        recordId,
        req.body,
      );
      res.status(201).json(treatment);
    } catch (error: any) {
      if (error.message === "Medical Record not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(400).json({ message: error.message });
    }
  }

  async updateTreatment(req: Request, res: Response): Promise<void> {
    try {
      const recordId = parseInt(req.params.id as string);
      const treatmentId = parseInt(req.params.treatmentId as string);
      const treatment = await this.medicalRecordService.updateTreatment(
        recordId,
        treatmentId,
        req.body,
      );
      if (!treatment) {
        res.status(404).json({ message: "Treatment not found" });
        return;
      }
      res.json(treatment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}