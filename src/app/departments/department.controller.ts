import { Service } from "typedi";
import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { DepartmentService } from "./department.service";
import { authenticateToken } from "../../server/middlewares/auth.middleware";
import { authorizeRole } from "../../server/middlewares/authorization.middleware";
import { validate } from "../../server/middlewares/validation.middleware";

@Service()
export class DepartmentController {
  private router = Router();

  constructor(private readonly departmentService: DepartmentService) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    const createDepartmentValidation = [body("name").notEmpty(), body("description").optional(), validate];

    this.router.get("/", this.getAll.bind(this));
    this.router.post("/", authenticateToken, authorizeRole(["admin"]), createDepartmentValidation, this.create.bind(this));
    this.router.get("/:id", this.getById.bind(this));
    this.router.put("/:id", authenticateToken, authorizeRole(["admin"]), this.update.bind(this));
    this.router.delete("/:id", authenticateToken, authorizeRole(["admin"]), this.delete.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const departments = await this.departmentService.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const department = await this.departmentService.getDepartmentById(parseInt(req.params.id as string));
      if (!department) {
        res.status(404).json({ message: "Department not found" });
        return;
      }
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const department = await this.departmentService.createDepartment(req.body);
      res.status(201).json(department);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const department = await this.departmentService.updateDepartment(parseInt(req.params.id as string), req.body);
      if (!department) {
        res.status(404).json({ message: "Department not found" });
        return;
      }
      res.json(department);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.departmentService.deleteDepartment(parseInt(req.params.id as string));
      if (!result) {
        res.status(404).json({ message: "Department not found" });
        return;
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}