import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { MedicalRecordController } from "./medicalRecord.controller";
import { MedicalRecordService } from "./medicalRecord.service";
import { AuditLogService } from "../audit/auditLog.service";
import { PatientRepository } from "../patients/patient.repository";
import { DoctorRepository } from "../doctors/doctor.repository";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("MedicalRecordController", () => {
  let app: express.Express;
  let medicalRecordServiceMock: jest.Mocked<MedicalRecordService>;
  let auditLogServiceMock: jest.Mocked<AuditLogService>;
  let patientRepositoryMock: jest.Mocked<PatientRepository>;
  let doctorRepositoryMock: jest.Mocked<DoctorRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    medicalRecordServiceMock = {
      getAllMedicalRecords: jest.fn(),
      getMedicalRecordById: jest.fn(),
      createMedicalRecord: jest.fn(),
      updateMedicalRecord: jest.fn(),
      deleteMedicalRecord: jest.fn(),
      addTestResult: jest.fn(),
      addTreatment: jest.fn(),
      updateTreatment: jest.fn(),
      getAppointmentsByDoctorAndPatient: jest.fn(),
    } as unknown as jest.Mocked<MedicalRecordService>;

    auditLogServiceMock = {
      logAction: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    patientRepositoryMock = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    doctorRepositoryMock = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<DoctorRepository>;

    Container.set(MedicalRecordService, medicalRecordServiceMock);
    Container.set(AuditLogService, auditLogServiceMock);
    Container.set(PatientRepository, patientRepositoryMock);
    Container.set(DoctorRepository, doctorRepositoryMock);

    jest
      .spyOn(AuthMiddleware, "authenticateToken")
      .mockImplementation(async (req, res, next) => {
        (req as any).user = { id: 1, role: "doctor" };
        next();
      });

    jest
      .spyOn(RoleMiddleware, "authorizeRole")
      .mockReturnValue((req, res, next) => next());

    const controller = Container.get(MedicalRecordController);
    app = express();
    app.use(json());
    app.use("/medical-records", controller.getRouter());
  });

  describe("GET /medical-records", () => {
    it("should return medical records list", async () => {
      const records = [{ id: 1, patientId: 1, diagnosis: "Flu" }];
      const doctor = { id: 1 };

      doctorRepositoryMock.findByUserId.mockResolvedValueOnce(doctor as any);
      medicalRecordServiceMock.getAllMedicalRecords.mockResolvedValueOnce(
        records as any,
      );

      const res = await request(app).get("/medical-records");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(records);
    });
  });

  describe("GET /medical-records/:id", () => {
    it("should return medical record by id", async () => {
      const record = { id: 1, patientId: 1, doctorId: 1, diagnosis: "Flu" };
      const doctor = { id: 1 };

      medicalRecordServiceMock.getMedicalRecordById.mockResolvedValueOnce(
        record as any,
      );
      doctorRepositoryMock.findByUserId.mockResolvedValueOnce(doctor as any);

      const res = await request(app).get("/medical-records/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(record);
    });
  });

  describe("POST /medical-records", () => {
    it("should create medical record if doctor has appointment", async () => {
      const body = { patientId: 1, diagnosis: "Flu" };
      const record = { id: 1, ...body, doctorId: 1 };
      const doctor = { id: 1 };
      const appointments = [{ id: 1 }];

      doctorRepositoryMock.findByUserId.mockResolvedValueOnce(doctor as any);
      medicalRecordServiceMock.getAppointmentsByDoctorAndPatient.mockResolvedValueOnce(
        appointments as any,
      );
      medicalRecordServiceMock.createMedicalRecord.mockResolvedValueOnce(
        record as any,
      );

      const res = await request(app).post("/medical-records").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(record);
      expect(auditLogServiceMock.logAction).toHaveBeenCalled();
    });

    it("should deny creation if doctor has no appointment", async () => {
      const body = { patientId: 99, diagnosis: "Checkup" };
      const doctor = { id: 1 };

      doctorRepositoryMock.findByUserId.mockResolvedValueOnce(doctor as any);
      medicalRecordServiceMock.getAppointmentsByDoctorAndPatient.mockResolvedValueOnce(
        [],
      );

      const res = await request(app).post("/medical-records").send(body);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });
  });

  describe("PATCH /medical-records/:id", () => {
    it("should update medical record", async () => {
      const body = { diagnosis: "Updated Flu" };
      const record = { id: 1, patientId: 1, doctorId: 1 };
      const doctor = { id: 1 };

      medicalRecordServiceMock.getMedicalRecordById.mockResolvedValueOnce(
        record as any,
      );
      doctorRepositoryMock.findByUserId.mockResolvedValueOnce(doctor as any);
      medicalRecordServiceMock.updateMedicalRecord.mockResolvedValueOnce({
        ...record,
        ...body,
      } as any);

      const res = await request(app).patch("/medical-records/1").send(body);

      expect(res.status).toBe(200);
      expect(auditLogServiceMock.logAction).toHaveBeenCalled();
    });
  });

  describe("DELETE /medical-records/:id", () => {
    it("should delete medical record", async () => {
      medicalRecordServiceMock.deleteMedicalRecord.mockResolvedValueOnce(true);

      const res = await request(app).delete("/medical-records/1");

      expect(res.status).toBe(204);
      expect(auditLogServiceMock.logAction).toHaveBeenCalled();
    });
  });

  describe("POST /medical-records/:id/test-results", () => {
    it("should add test result", async () => {
      const body = {
        testType: "Blood Test",
        result: "Normal",
        date: "2023-10-10",
      };
      const testResult = { id: 1, ...body };

      medicalRecordServiceMock.addTestResult.mockResolvedValueOnce(
        testResult as any,
      );

      const res = await request(app)
        .post("/medical-records/1/test-results")
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(testResult);
    });
  });

  describe("POST /medical-records/:id/treatments", () => {
    it("should add treatment", async () => {
      const body = { name: "Aspirin", startDate: "2023-10-10" };
      const treatment = { id: 1, ...body };

      medicalRecordServiceMock.addTreatment.mockResolvedValueOnce(
        treatment as any,
      );

      const res = await request(app)
        .post("/medical-records/1/treatments")
        .send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(treatment);
    });
  });

  describe("PATCH /medical-records/:id/treatments/:treatmentId", () => {
    it("should update treatment", async () => {
      const body = { status: "completed" };
      const treatment = { id: 1, ...body };

      medicalRecordServiceMock.updateTreatment.mockResolvedValueOnce(
        treatment as any,
      );

      const res = await request(app)
        .patch("/medical-records/1/treatments/1")
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(treatment);
    });
  });
});