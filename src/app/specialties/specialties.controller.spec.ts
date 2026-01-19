import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { SpecialtyController } from "./specialty.controller";
import { SpecialtyService } from "./specialty.service";
import { AuditLogService } from "../audit/auditLog.service";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("SpecialtyController", () => {
  let app: express.Express;
  let specialtyServiceMock: jest.Mocked<SpecialtyService>;
  let auditLogServiceMock: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    specialtyServiceMock = {
      getAllSpecialties: jest.fn(),
      getSpecialtyById: jest.fn(),
      createSpecialty: jest.fn(),
      updateSpecialty: jest.fn(),
      deleteSpecialty: jest.fn(),
    } as unknown as jest.Mocked<SpecialtyService>;

    auditLogServiceMock = {
      logAction: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(SpecialtyService, specialtyServiceMock);
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

    const controller = Container.get(SpecialtyController);
    app = express();
    app.use(json());
    app.use("/specialties", controller.getRouter());
  });

  describe("GET /specialties", () => {
    it("should return specialties list", async () => {
      const specialties = [{ id: 1, name: "Cardiology" }];

      specialtyServiceMock.getAllSpecialties.mockResolvedValueOnce(
        specialties as any,
      );

      const res = await request(app).get("/specialties");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(specialties);
    });
  });

  describe("GET /specialties/:id", () => {
    it("should return specialty by id", async () => {
      const specialty = { id: 1, name: "Cardiology" };

      specialtyServiceMock.getSpecialtyById.mockResolvedValueOnce(
        specialty as any,
      );

      const res = await request(app).get("/specialties/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(specialty);
    });
  });

  describe("POST /specialties", () => {
    it("should create specialty", async () => {
      const body = { name: "Neurology" };
      const specialty = { id: 1, ...body };

      specialtyServiceMock.createSpecialty.mockResolvedValueOnce(
        specialty as any,
      );

      const res = await request(app).post("/specialties").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(specialty);
    });
  });

  describe("PUT /specialties/:id", () => {
    it("should update specialty", async () => {
      const body = { name: "Updated Neurology" };
      const specialty = { id: 1, ...body };

      specialtyServiceMock.updateSpecialty.mockResolvedValueOnce(
        specialty as any,
      );

      const res = await request(app).put("/specialties/1").send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(specialty);
    });
  });

  describe("DELETE /specialties/:id", () => {
    it("should delete specialty", async () => {
      specialtyServiceMock.deleteSpecialty.mockResolvedValueOnce(true);

      const res = await request(app).delete("/specialties/1");

      expect(res.status).toBe(204);
    });
  });
});