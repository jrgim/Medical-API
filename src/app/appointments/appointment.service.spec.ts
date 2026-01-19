import "reflect-metadata";
import { Container } from "typedi";
import { AppointmentService } from "./appointment.service";
import { AppointmentRepository } from "./appointment.repository";
import { AvailabilityRepository } from "../availability/availability.repository";
import { NotificationService } from "../notifications/notification.service";
import { PatientRepository } from "../patients/patient.repository";
import { DoctorRepository } from "../doctors/doctor.repository";
import {
  Appointment,
  AppointmentCreateDto,
  AppointmentUpdateDto,
} from "./appointment.model";

describe("AppointmentService", () => {
  let appointmentService: AppointmentService;
  let appointmentRepositoryMock: jest.Mocked<AppointmentRepository>;
  let availabilityRepositoryMock: jest.Mocked<AvailabilityRepository>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let patientRepositoryMock: jest.Mocked<PatientRepository>;
  let doctorRepositoryMock: jest.Mocked<DoctorRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    appointmentRepositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AppointmentRepository>;

    availabilityRepositoryMock = {
      findByDoctorId: jest.fn(),
      updateAvailabilityStatus: jest.fn(),
    } as unknown as jest.Mocked<AvailabilityRepository>;

    notificationServiceMock = {
      createNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    patientRepositoryMock = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    doctorRepositoryMock = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<DoctorRepository>;

    Container.set(AppointmentRepository, appointmentRepositoryMock);
    Container.set(AvailabilityRepository, availabilityRepositoryMock);
    Container.set(NotificationService, notificationServiceMock);
    Container.set(PatientRepository, patientRepositoryMock);
    Container.set(DoctorRepository, doctorRepositoryMock);

    appointmentService = Container.get(AppointmentService);
  });

  describe("getAppointments", () => {
    it("should return appointments based on criteria", async () => {
      const criteria = { doctorId: 1 };
      const appointments: Appointment[] = [
        {
          id: 1,
          patientId: 1,
          doctorId: 1,
          appointmentDate: "2023-10-10",
          appointmentTime: "10:00",
          status: "scheduled",
        },
      ];

      appointmentRepositoryMock.findAll.mockResolvedValueOnce(appointments);

      const result = await appointmentService.getAppointments(criteria);

      expect(appointmentRepositoryMock.findAll).toHaveBeenCalledWith(criteria);
      expect(result).toEqual(appointments);
    });
  });

  describe("getAppointmentById", () => {
    it("should return appointment by id", async () => {
      const appointment: Appointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
        status: "scheduled",
      };

      appointmentRepositoryMock.findById.mockResolvedValueOnce(appointment);

      const result = await appointmentService.getAppointmentById(1);

      expect(appointmentRepositoryMock.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(appointment);
    });
  });

  describe("createAppointment", () => {
    it("should create appointment if slot is available", async () => {
      const createDto = {
        patientId: 1,
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
        reason: "Checkup",
      };

      const slots = [{ time: "10:00", isAvailable: true }];
      const createdAppointment: Appointment = {
        id: 1,
        ...createDto,
        status: "scheduled",
      };
      const patient = { id: 1, userId: 100 };

      availabilityRepositoryMock.findByDoctorId.mockResolvedValueOnce(
        slots as any,
      );
      appointmentRepositoryMock.create.mockResolvedValueOnce(
        createdAppointment,
      );
      patientRepositoryMock.findById.mockResolvedValueOnce(patient as any);

      const result = await appointmentService.createAppointment(createDto);

      expect(availabilityRepositoryMock.findByDoctorId).toHaveBeenCalledWith(
        1,
        "2023-10-10",
      );
      expect(appointmentRepositoryMock.create).toHaveBeenCalled();
      expect(
        availabilityRepositoryMock.updateAvailabilityStatus,
      ).toHaveBeenCalledWith(1, "2023-10-10", "10:00", false);
      expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(result).toEqual(createdAppointment);
    });

    it("should throw error if slot is not available", async () => {
      const createDto = {
        patientId: 1,
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
      };

      availabilityRepositoryMock.findByDoctorId.mockResolvedValueOnce([]);

      await expect(
        appointmentService.createAppointment(createDto),
      ).rejects.toThrow("No availability slot found for this date and time");
    });
  });

  describe("updateAppointment", () => {
    it("should update appointment and check availability if time changed", async () => {
      const id = 1;
      const updateDto: AppointmentUpdateDto = { appointmentTime: "11:00" };
      const user = { role: "admin" };
      const existingAppointment: Appointment = {
        id,
        patientId: 1,
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
        status: "scheduled",
      };
      const slots = [{ time: "11:00", isAvailable: true }];
      const updatedAppointment = { ...existingAppointment, ...updateDto };

      appointmentRepositoryMock.findById.mockResolvedValueOnce(
        existingAppointment,
      );
      availabilityRepositoryMock.findByDoctorId.mockResolvedValueOnce(
        slots as any,
      );
      appointmentRepositoryMock.update.mockResolvedValueOnce(
        updatedAppointment,
      );

      const result = await appointmentService.updateAppointment(
        id,
        updateDto,
        user,
      );

      expect(appointmentRepositoryMock.findById).toHaveBeenCalledWith(id);
      expect(availabilityRepositoryMock.findByDoctorId).toHaveBeenCalledWith(
        1,
        "2023-10-10",
      );
      expect(appointmentRepositoryMock.update).toHaveBeenCalledWith(
        id,
        updateDto,
      );
      expect(result).toEqual(updatedAppointment);
    });
  });

  describe("deleteAppointment", () => {
    it("should delete appointment", async () => {
      appointmentRepositoryMock.delete.mockResolvedValueOnce(true);

      const result = await appointmentService.deleteAppointment(1);

      expect(appointmentRepositoryMock.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe("rescheduleAppointment", () => {
    it("should reschedule appointment if new slot valid", async () => {
      const id = 1;
      const newDateTime = "2023-10-11T10:00";
      const existingAppointment: Appointment = {
        id,
        patientId: 1,
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
        status: "scheduled",
      };
      const slots = [{ time: "10:00", isAvailable: true }];
      const updatedAppointment = {
        ...existingAppointment,
        appointmentDate: "2023-10-11",
        appointmentTime: "10:00",
      };
      const patient = { id: 1, userId: 100 };

      appointmentRepositoryMock.findById.mockResolvedValueOnce(
        existingAppointment,
      );
      availabilityRepositoryMock.findByDoctorId.mockResolvedValueOnce(
        slots as any,
      );
      appointmentRepositoryMock.update.mockResolvedValueOnce(
        updatedAppointment,
      );
      patientRepositoryMock.findById.mockResolvedValueOnce(patient as any);

      const result = await appointmentService.rescheduleAppointment(
        id,
        newDateTime,
      );

      expect(availabilityRepositoryMock.findByDoctorId).toHaveBeenCalledWith(
        1,
        "2023-10-11",
      );
      expect(appointmentRepositoryMock.update).toHaveBeenCalled();
      expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(result).toEqual(updatedAppointment);
    });
  });

  describe("cancelAppointment", () => {
    it("should cancel appointment and release slot", async () => {
      const id = 1;
      const existingAppointment: Appointment = {
        id,
        patientId: 1,
        doctorId: 1,
        appointmentDate: "2023-10-10",
        appointmentTime: "10:00",
        status: "scheduled",
      };
      const cancelledAppointment = {
        ...existingAppointment,
        status: "cancelled" as const,
      };
      const patient = { id: 1, userId: 100 };

      appointmentRepositoryMock.findById.mockResolvedValueOnce(
        existingAppointment,
      );
      appointmentRepositoryMock.update.mockResolvedValueOnce(
        cancelledAppointment,
      );
      patientRepositoryMock.findById.mockResolvedValueOnce(patient as any);

      const result = await appointmentService.cancelAppointment(id);

      expect(appointmentRepositoryMock.update).toHaveBeenCalledWith(id, {
        status: "cancelled",
      });
      expect(
        availabilityRepositoryMock.updateAvailabilityStatus,
      ).toHaveBeenCalledWith(1, "2023-10-10", "10:00", true);
      expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(result).toEqual(cancelledAppointment);
    });
  });
});