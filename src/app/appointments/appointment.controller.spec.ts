import "reflect-metadata";
import request from "supertest";
import express from "express";
import { Container } from "typedi";
import { AppointmentController } from "./appointment.controller";
import { AppointmentService } from "./appointment.service";
import { AuditLogService } from "../audit/auditLog.service";
import { json } from "body-parser";
import * as AuthMiddleware from "../../server/middlewares/auth.middleware";
import * as RoleMiddleware from "../../server/middlewares/authorization.middleware";

describe("AppointmentController", () => {
  let app: express.Express;
  let appointmentServiceMock: jest.Mocked<AppointmentService>;
  let auditLogServiceMock: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    appointmentServiceMock = {
      getAppointments: jest.fn(),
      getAppointmentById: jest.fn(),
      createAppointment: jest.fn(),
      updateAppointment: jest.fn(),
      deleteAppointment: jest.fn(),
      rescheduleAppointment: jest.fn(),
      cancelAppointment: jest.fn(),
      getPatientByUserId: jest.fn(),
      getDoctorByUserId: jest.fn(),
    } as unknown as jest.Mocked<AppointmentService>;

    auditLogServiceMock = {
      logAction: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(AppointmentService, appointmentServiceMock);
    Container.set(AuditLogService, auditLogServiceMock);

    jest
      .spyOn(AuthMiddleware, "authenticateToken")
      .mockImplementation(async (req, res, next) => {
        (req as any).user = { id: 1, role: "patient" };
        next();
      });

    jest
      .spyOn(RoleMiddleware, "authorizeRole")
      .mockReturnValue((req, res, next) => next());

    const controller = Container.get(AppointmentController);
    app = express();
    app.use(json());
    app.use("/appointments", controller.getRouter());
  });

  describe("GET /appointments", () => {
    it("should return appointments list", async () => {
      const appointments = [{ id: 1, status: "scheduled" }];
      const patient = { id: 1 };

      appointmentServiceMock.getPatientByUserId.mockResolvedValueOnce(
        patient as any,
      );
      appointmentServiceMock.getAppointments.mockResolvedValueOnce(
        appointments as any,
      );

      const res = await request(app).get("/appointments");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(appointments);
      expect(appointmentServiceMock.getAppointments).toHaveBeenCalled();
    });
  });

  describe("GET /appointments/:id", () => {
    it("should return appointment by id", async () => {
      const appointment = { id: 1, patientId: 1 };
      const patient = { id: 1 };

      appointmentServiceMock.getAppointmentById.mockResolvedValueOnce(
        appointment as any,
      );
      appointmentServiceMock.getPatientByUserId.mockResolvedValueOnce(
        patient as any,
      );

      const res = await request(app).get("/appointments/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(appointment);
    });
  });

  describe("POST /appointments", () => {
    it("should create appointment", async () => {
      const body = {
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
        reason: "Consultation",
      };
      const appointment = { id: 1, ...body, status: "scheduled" };
      const patient = { id: 1 };

      appointmentServiceMock.getPatientByUserId.mockResolvedValueOnce(
        patient as any,
      );
      appointmentServiceMock.createAppointment.mockResolvedValueOnce(
        appointment as any,
      );

      const res = await request(app).post("/appointments").send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(appointment);
      expect(auditLogServiceMock.logAction).toHaveBeenCalled();
    });
  });

  describe("PATCH /appointments/:id/reschedule", () => {
    it("should reschedule appointment", async () => {
      const body = { newDateTime: "2023-10-12T10:00" };
      const appointment = { id: 1, patientId: 1 };
      const patient = { id: 1 };

      appointmentServiceMock.getAppointmentById.mockResolvedValueOnce(
        appointment as any,
      );
      appointmentServiceMock.getPatientByUserId.mockResolvedValueOnce(
        patient as any,
      );
      appointmentServiceMock.rescheduleAppointment.mockResolvedValueOnce(
        appointment as any,
      );

      const res = await request(app)
        .patch("/appointments/1/reschedule")
        .send(body);

      expect(res.status).toBe(200);
      expect(auditLogServiceMock.logAction).toHaveBeenCalled();
    });
  });

  describe("PATCH /appointments/:id/cancel", () => {
    it("should cancel appointment", async () => {
      const body = { reason: "Sick" };
      const appointment = { id: 1, patientId: 1 };
      const patient = { id: 1 };

      appointmentServiceMock.getAppointmentById.mockResolvedValueOnce(
        appointment as any,
      );
      appointmentServiceMock.getPatientByUserId.mockResolvedValueOnce(
        patient as any,
      );
      appointmentServiceMock.cancelAppointment.mockResolvedValueOnce(
        appointment as any,
      );

      const res = await request(app).patch("/appointments/1/cancel").send(body);

      expect(res.status).toBe(200);
      expect(auditLogServiceMock.logAction).toHaveBeenCalled();
    });
  });

  describe("DELETE /appointments/:id", () => {
    it("should delete appointment", async () => {
      appointmentServiceMock.deleteAppointment.mockResolvedValueOnce(true);

      const res = await request(app).delete("/appointments/1");

      expect(res.status).toBe(204);
    });
  });
});