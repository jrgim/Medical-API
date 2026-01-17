import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { PublicService } from "./public.service";
import { validate } from "../../server/middlewares/validation.middleware";
import { AuditLogService } from "../audit/auditLog.service";

@Service()
export class PublicController {
    private router = Router();

    constructor(
        private readonly publicService: PublicService,
        private readonly auditLogService: AuditLogService,
    ) {
        this.setupRoutes();
    }

    private setupRoutes(): void {
        const loginValidation = [
        body("email").isEmail(),
        body("password").notEmpty(),
        validate,
        ];

        this.router.get("/doctors", this.getAllDoctors.bind(this));
        this.router.get("/doctors/:id", this.getDoctorById.bind(this));
        this.router.post("/login", loginValidation, this.login.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async getAllDoctors(req: Request, res: Response): Promise<void> {
        try {
        const doctors = await this.publicService.getAllDoctors(req.query);
        res.json({ data: doctors });
        } catch (error: any) {
        res.status(500).json({ message: error.message });
        }
    }

    async getDoctorById(req: Request, res: Response): Promise<void> {
        try {
        const doctor = await this.publicService.getDoctorById(
            parseInt(req.params.id as string),
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

    async login(req: Request, res: Response): Promise<void> {
        try {
        const result = await this.publicService.login(
            req.body.email,
            req.body.password,
        );

        await this.auditLogService.logAction(
            result.user.id,
            "LOGIN",
            "user",
            result.user.id,
        );

        res.json(result);
        } catch (error: any) {
        await this.auditLogService.logAction(
            undefined,
            "LOGIN_FAILED",
            "user",
            undefined,
        );

        res.status(401).json({ message: error.message });
        }
    }
}