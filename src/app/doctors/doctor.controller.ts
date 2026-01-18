import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { DoctorService } from "./doctor.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";
import { AuditLogService } from "../audit/auditLog.service";

@Service()
export class DoctorController {
    private router = Router();

    constructor(
    private readonly doctorService: DoctorService,
    private readonly auditLogService: AuditLogService,
    ) {
    this.setupRoutes();
    }

    private setupRoutes(): void {
        const createDoctorValidation = [
        body("email").isEmail(),
        body("password").isLength({ min: 8 }),
        body("firstName").notEmpty(),
        body("lastName").notEmpty(),
        body("licenseNumber").notEmpty(),
        body("specialtyIds").isArray(),
        validate,
        ];

        this.router.get("/", authenticateToken, this.getAll.bind(this));
        this.router.post("/", authenticateToken, authorizeRole(["admin"]), createDoctorValidation, this.create.bind(this));
        this.router.get("/:id", authenticateToken, this.getById.bind(this));
        this.router.put("/:id", authenticateToken,authorizeRole(["doctor", "admin"]),this.update.bind(this));
        this.router.put("/:id/specialties",authenticateToken,authorizeRole(["admin"]),this.updateSpecialties.bind(this));
        this.router.delete("/:id",authenticateToken,authorizeRole(["admin"]),this.delete.bind(this));
        }

    getRouter(): Router {
        return this.router;
    }

    async getAll(req: Request, res: Response): Promise<void> {
        try {
        const filters = {
            specialtyId: req.query.specialtyId as string,
            date: req.query.date as string,
        };
        const doctors = await this.doctorService.getAllDoctors(filters);
        res.json(doctors);
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
        const user = (req as any).user;
        const doctorId = parseInt(req.params.id as string);

        const doctor = await this.doctorService.getDoctorById(doctorId);
        if (!doctor) {
            res.status(404).json({ message: "Doctor not found" });
            return;
        }

        if (user.role === "doctor") {
            const doctorProfile = await this.doctorService.getDoctorByUserId(
            user.id,
            );
            if (!doctorProfile || doctorProfile.id !== doctorId) {
            res.status(403).json({
                message: "Access denied: You can only view your own profile",
            });
            return;
            }
        }
        res.json(doctor);
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
        const doctor = await this.doctorService.createDoctor(req.body);

        await this.auditLogService.logAction(
            (req as any).user.id,
            "CREATE",
            "doctor",
            doctor.id,
        );

        res.status(201).json(doctor);
        } catch (error: any) {
        res.status(400).json({ message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
        const user = (req as any).user;
        const doctorId = parseInt(req.params.id as string);
        if (user.role === "doctor") {
            const doctorProfile = await this.doctorService.getDoctorByUserId(
            user.id,
            );
            if (!doctorProfile || doctorProfile.id !== doctorId) {
            res.status(403).json({
                message: "Access denied: You can only update your own profile",
            });
            return;
            }
        }

        const doctor = await this.doctorService.updateDoctor(doctorId, req.body);
        if (!doctor) {
            res.status(404).json({ message: "Doctor not found" });
            return;
        }
        res.json(doctor);
        } catch (error: any) {
        res.status(400).json({ message: error.message });
        }
    }

    async updateSpecialties(req: Request, res: Response): Promise<void> {
        try {
        const doctorId = parseInt(req.params.id as string);
        const doctor = await this.doctorService.updateSpecialties(
            doctorId,
            req.body.specialtyIds,
        );

        await this.auditLogService.logAction(
            (req as any).user.id,
            "UPDATE_SPECIALTIES",
            "doctor",
            doctorId,
        );

        res.json(doctor);
        } catch (error: any) {
        res.status(400).json({ message: error.message });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
        const doctorId = parseInt(req.params.id as string);
        const result = await this.doctorService.deleteDoctor(doctorId);
        if (!result) {
            res.status(404).json({ message: "Doctor not found" });
            return;
        }

        await this.auditLogService.logAction(
            (req as any).user.id,
            "DELETE",
            "doctor",
            doctorId,
        );

        res.sendStatus(204);
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }
}