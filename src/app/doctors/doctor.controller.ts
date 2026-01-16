import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { DoctorService } from "./doctor.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";

@Service()
export class DoctorController {
    private router = Router();

    constructor(private readonly doctorService: DoctorService) {
        this.setupRoutes();
    }

    private setupRoutes(): void {
        const createDoctorValidation = [
        body("userId").notEmpty(),
        body("specialtyIds").isArray(),
        validate,
        ];

        this.router.get("/", this.getAll.bind(this));
        this.router.post("/", authenticateToken, authorizeRole(["admin"]), createDoctorValidation, this.create.bind(this));
        this.router.get("/:id", this.getById.bind(this));
        this.router.put("/:id", authenticateToken,authorizeRole(["doctor", "admin"]),this.update.bind(this));
        this.router.put("/:id/specialties",authenticateToken,authorizeRole(["admin"]),this.updateSpecialties.bind(this));
        this.router.delete("/:id",authenticateToken,authorizeRole(["admin"]),this.delete.bind(this));
        }

        getRouter(): Router {
            return this.router;
        }

    async getAll(req: Request, res: Response): Promise<void> {
        try {
        const doctors = await this.doctorService.getAllDoctors(req.query);
        res.json(doctors);
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
        const doctor = await this.doctorService.getDoctorById(
            parseInt(req.params.id as string)
        );
        if (!doctor) {
            res.status(404).json({ message: "Doctor not found" });
            return;
        }
        res.json(doctor);
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
        const doctor = await this.doctorService.createDoctor(req.body);
        res.status(201).json(doctor);
        } catch (error: any) {
        res.status(400).json({ message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
        const doctor = await this.doctorService.updateDoctor(
            parseInt(req.params.id as string),
            req.body
        );
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
        const doctor = await this.doctorService.updateSpecialties(
            parseInt(req.params.id as string),
            req.body.specialtyIds
        );
        res.json(doctor);
        } catch (error: any) {
        res.status(400).json({ message: error.message });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
        const result = await this.doctorService.deleteDoctor(
            parseInt(req.params.id as string)
        );
        if (!result) {
            res.status(404).json({ message: "Doctor not found" });
            return;
        }
        res.sendStatus(204);
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }
}