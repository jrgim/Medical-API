import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { SpecialtyService } from "./specialty.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";

@Service()
export class SpecialtyController {
  private router = Router();

  constructor(private readonly specialtyService: SpecialtyService) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const createSpecialtyValidation = [
      body("name").notEmpty(),
      body("description").optional(),
      validate,
    ];

    this.router.get("/", this.getAll.bind(this));
    this.router.post("/", authenticateToken, authorizeRole(["admin"]), createSpecialtyValidation, this.create.bind(this));
    this.router.get("/:id", this.getById.bind(this));
    this.router.put("/:id", authenticateToken, authorizeRole(["admin"]), this.update.bind(this));
    this.router.delete("/:id", authenticateToken, authorizeRole(["admin"]), this.delete.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const specialties = await this.specialtyService.getAllSpecialties();
      res.json(specialties);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const specialty = await this.specialtyService.getSpecialtyById(
        parseInt(req.params.id as string)
      );
      if (!specialty) {
        res.status(404).json({ message: "Specialty not found" });
        return;
      }
      res.json(specialty);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const specialty = await this.specialtyService.createSpecialty(req.body);
      res.status(201).json(specialty);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const specialty = await this.specialtyService.updateSpecialty(
        parseInt(req.params.id as string),
        req.body
      );
      if (!specialty) {
        res.status(404).json({ message: "Specialty not found" });
        return;
      }
      res.json(specialty);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.specialtyService.deleteSpecialty(
        parseInt(req.params.id as string)
      );
      if (!result) {
        res.status(404).json({ message: "Specialty not found" });
        return;
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}