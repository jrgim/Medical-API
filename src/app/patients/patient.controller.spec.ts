import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";
import { AuditLogService } from "../audit/auditLog.service";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("PatientController", () => {
  let app: express.Express;
  let patientServiceMock: jest.Mocked<PatientService>;
  let auditLogServiceMock: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    patientServiceMock = {
      getAllPatients: jest.fn(),
      getPatientById: jest.fn(),
      createPatient: jest.fn(),
      updatePatient: jest.fn(),
      deletePatient: jest.fn(),
      getPatientsByDoctorId: jest.fn(),
      getPatientByUserId: jest.fn(),
    } as unknown as jest.Mocked<PatientService>;

    auditLogServiceMock = {
      logAction: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(PatientService, patientServiceMock);
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

    const controller = Container.get(PatientController);
    app = express();
    app.use(json());
    app.use("/patients", controller.getRouter());
  });

  describe("GET /patients", () => {
    it("should return patients list", async () => {
      const patients = [{ id: 1, firstName: "John", lastName: "Doe" }];

      patientServiceMock.getAllPatients.mockResolvedValueOnce(patients as any);

      const res = await request(app).get("/patients");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(patients);
    });
  });

  describe("GET /patients/:id", () => {
    it("should return patient by id", async () => {
      const patient = { id: 1, firstName: "John", lastName: "Doe" };

      patientServiceMock.getPatientById.mockResolvedValueOnce(patient as any);

      const res = await request(app).get("/patients/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(patient);
    });
  });

  describe("POST /patients", () => {
    it("should create patient", async () => {
      const body = {
        email: "patient@test.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
      };
      const patient = { id: 1, ...body };

      patientServiceMock.createPatient.mockResolvedValueOnce(patient as any);

      const res = await request(app).post("/patients").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(patient);
    });
  });

  describe("PUT /patients/:id", () => {
    it("should update patient", async () => {
      const body = { phone: "123456789" };
      const patient = { id: 1, phone: "123456789" };

      patientServiceMock.updatePatient.mockResolvedValueOnce(patient as any);

      const res = await request(app).put("/patients/1").send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(patient);
    });
  });

  describe("DELETE /patients/:id", () => {
    it("should delete patient", async () => {
      patientServiceMock.deletePatient.mockResolvedValueOnce(true);

      const res = await request(app).delete("/patients/1");

      expect(res.status).toBe(204);
    });
    describe("Role Access Control", () => {
      it("should allow patient to access their own details", async () => {
        jest
          .spyOn(AuthMiddleware, "authenticateToken")
          .mockImplementation(async (req, res, next) => {
            (req as any).user = { id: 10, role: "patient" };
            next();
          });

        const patient = { id: 1, userId: 10, firstName: "John" };

        patientServiceMock.getPatientById.mockResolvedValueOnce(patient as any);
        patientServiceMock.getPatientByUserId.mockResolvedValueOnce(
          patient as any,
        );

        const res = await request(app).get("/patients/1");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(patient);
      });

      it("should deny patient access to other patient details", async () => {
        jest
          .spyOn(AuthMiddleware, "authenticateToken")
          .mockImplementation(async (req, res, next) => {
            (req as any).user = { id: 10, role: "patient" };
            next();
          });

        const targetPatient = { id: 2, userId: 20, firstName: "Jane" };
        const myProfile = { id: 1, userId: 10, firstName: "John" };

        patientServiceMock.getPatientById.mockResolvedValueOnce(
          targetPatient as any,
        );
        patientServiceMock.getPatientByUserId.mockResolvedValueOnce(
          myProfile as any,
        );

        const res = await request(app).get("/patients/2");

        expect(res.status).toBe(403);
        expect(res.body.message).toContain("Access denied");
      });
    });
  });
});