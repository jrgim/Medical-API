import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { PatientService } from "./patient.service";
import { MedicalRecordService } from "../medical-records/medicalRecord.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";
import { AuditLogService } from "../audit/auditLog.service";

@Service()
export class PatientController {
  private router = Router();

  constructor(
    private readonly patientService: PatientService,
    private readonly medicalRecordService: MedicalRecordService,
    private readonly auditLogService: AuditLogService
  ) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const createPatientValidation = [
      body("email").isEmail(),
      body("password").isLength({ min: 8 }),
      body("firstName").notEmpty(),
      body("lastName").notEmpty(),
      body("dateOfBirth").isISO8601(),
      body("phone").optional(),
      body("address").optional(),
      validate,
    ];

    const updatePatientValidation = [
      body("firstName").optional(),
      body("lastName").optional(),
      body("phone").optional(),
      body("address").optional(),
      body("allergies").optional().isArray(),
      validate,
    ];

    // POST /patients is public (no auth required)
    this.router.post("/", createPatientValidation, this.create.bind(this));

    // Protected routes
    this.router.get("/", authenticateToken, authorizeRole(["admin"]), this.getAll.bind(this));
    this.router.get("/:id", authenticateToken, this.getById.bind(this));

    this.router.get("/:patientId/medical-records", authenticateToken, this.getPatientMedicalRecords.bind(this));
    this.router.put("/:id", authenticateToken, updatePatientValidation, this.update.bind(this));
    this.router.delete("/:id", authenticateToken, authorizeRole(["admin"]), this.delete.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const patients = await this.patientService.getAllPatients(req.query);
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const patient = await this.patientService.getPatientById(
        parseInt(req.params.id as string)
      );
      if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
      }
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const patient = await this.patientService.createPatient(req.body);
      
      await this.auditLogService.logAction(
        (req as any).user?.id,
        'CREATE',
        'patient',
        patient.id
      );

      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const patient = await this.patientService.updatePatient(
        parseInt(req.params.id as string),
        req.body
      );
      if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
      }
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const patientId = parseInt(req.params.id as string);
      await this.patientService.deletePatient(patientId);
      
      await this.auditLogService.logAction(
        (req as any).user.id,
        "DELETE",
        "patient",
        patientId,
      );
      res.sendStatus(204);
    } catch (error: any) {
      if (error.message === "Patient not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: error.message });
    }
  }

  async getPatientMedicalRecords(req: Request, res: Response): Promise<void> {
    try {
      const patientId = parseInt(req.params.patientId as string);
      const records = await this.medicalRecordService.getPatientMedicalRecords(
        patientId
      );
      res.json({ data: records });
    } catch (error: any) {
      if (error.message === "Patient not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: error.message });
    }
  }
}