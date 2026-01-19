import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { DoctorController } from "./doctor.controller";
import { DoctorService } from "./doctor.service";
import { AuditLogService } from "../audit/auditLog.service";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("DoctorController", () => {
  let app: express.Express;
  let doctorServiceMock: jest.Mocked<DoctorService>;
  let auditLogServiceMock: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    doctorServiceMock = {
      getAllDoctors: jest.fn(),
      getDoctorById: jest.fn(),
      createDoctor: jest.fn(),
      updateDoctor: jest.fn(),
      deleteDoctor: jest.fn(),
      getBySpecialty: jest.fn(),
      addSpecialty: jest.fn(),
      removeSpecialty: jest.fn(),
    } as unknown as jest.Mocked<DoctorService>;

    auditLogServiceMock = {
      logAction: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(DoctorService, doctorServiceMock);
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

    const controller = Container.get(DoctorController);
    app = express();
    app.use(json());
    app.use("/doctors", controller.getRouter());
  });

  describe("GET /doctors", () => {
    it("should return doctors list", async () => {
      const doctors = [{ id: 1, firstName: "John", lastName: "Doe" }];

      doctorServiceMock.getAllDoctors.mockResolvedValueOnce(doctors as any);

      const res = await request(app).get("/doctors");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(doctors);
    });
  });

  describe("GET /doctors/:id", () => {
    it("should return doctor by id", async () => {
      const doctor = { id: 1, firstName: "John", lastName: "Doe" };

      doctorServiceMock.getDoctorById.mockResolvedValueOnce(doctor as any);

      const res = await request(app).get("/doctors/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(doctor);
    });
  });

  describe("POST /doctors", () => {
    it("should create doctor", async () => {
      const body = {
        email: "doctor@test.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        licenseNumber: "LIC123",
        specialtyIds: [1, 2],
      };
      const doctor = { id: 1, ...body };

      doctorServiceMock.createDoctor.mockResolvedValueOnce(doctor as any);

      const res = await request(app).post("/doctors").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(doctor);
    });
  });

  describe("PUT /doctors/:id", () => {
    it("should update doctor", async () => {
      const body = { phone: "123456789" };
      const doctor = { id: 1, phone: "123456789" };

      doctorServiceMock.updateDoctor.mockResolvedValueOnce(doctor as any);

      const res = await request(app).put("/doctors/1").send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(doctor);
    });
  });

  describe("DELETE /doctors/:id", () => {
    it("should delete doctor", async () => {
      doctorServiceMock.deleteDoctor.mockResolvedValueOnce(true);

      const res = await request(app).delete("/doctors/1");

      expect(res.status).toBe(204);
    });
  });
});