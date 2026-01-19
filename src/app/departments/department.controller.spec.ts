import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { DepartmentController } from "./department.controller";
import { DepartmentService } from "./department.service";
import { AuditLogService } from "../audit/auditLog.service";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("DepartmentController", () => {
  let app: express.Express;
  let departmentServiceMock: jest.Mocked<DepartmentService>;
  let auditLogServiceMock: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    departmentServiceMock = {
      getAllDepartments: jest.fn(),
      getDepartmentById: jest.fn(),
      createDepartment: jest.fn(),
      updateDepartment: jest.fn(),
      deleteDepartment: jest.fn(),
    } as unknown as jest.Mocked<DepartmentService>;

    auditLogServiceMock = {
      logAction: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(DepartmentService, departmentServiceMock);
    Container.set(AuditLogService, auditLogServiceMock);

    jest
      .spyOn(AuthMiddleware, "authenticateToken")
      .mockImplementation(async (req, res, next) => {
        (req as any).user = { id: 1, role: "admin" };
        next();
      });

    jest
      .spyOn(RoleMiddleware, "authorizeRole")
      .mockReturnValue((req, res, next) => next());

    const controller = Container.get(DepartmentController);
    app = express();
    app.use(json());
    app.use("/departments", controller.getRouter());
  });

  describe("GET /departments", () => {
    it("should return departments list", async () => {
      const departments = [{ id: 1, name: "Cardiology" }];

      departmentServiceMock.getAllDepartments.mockResolvedValueOnce(
        departments as any,
      );

      const res = await request(app).get("/departments");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(departments);
    });
  });

  describe("GET /departments/:id", () => {
    it("should return department by id", async () => {
      const department = { id: 1, name: "Cardiology" };

      departmentServiceMock.getDepartmentById.mockResolvedValueOnce(
        department as any,
      );

      const res = await request(app).get("/departments/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(department);
    });
  });

  describe("POST /departments", () => {
    it("should create department", async () => {
      const body = { name: "Neurology" };
      const department = { id: 1, ...body };

      departmentServiceMock.createDepartment.mockResolvedValueOnce(
        department as any,
      );

      const res = await request(app).post("/departments").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(department);
    });
  });

  describe("PUT /departments/:id", () => {
    it("should update department", async () => {
      const body = { name: "Updated Neurology" };
      const department = { id: 1, ...body };

      departmentServiceMock.updateDepartment.mockResolvedValueOnce(
        department as any,
      );

      const res = await request(app).put("/departments/1").send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(department);
    });
  });

  describe("DELETE /departments/:id", () => {
    it("should delete department", async () => {
      departmentServiceMock.deleteDepartment.mockResolvedValueOnce(true);

      const res = await request(app).delete("/departments/1");

      expect(res.status).toBe(204);
    });
  });
});