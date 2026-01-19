import "reflect-metadata";
import { Container } from "typedi";
import { MedicalRecordService } from "./medicalRecord.service";
import { MedicalRecordRepository } from "./medicalRecord.repository";
import { NotificationService } from "../notifications/notification.service";
import { PatientRepository } from "../patients/patient.repository";
import { AppointmentRepository } from "../appointments/appointment.repository";
import { DatabaseService } from "../../database/database.service";
import {
  MedicalRecord,
  MedicalRecordCreateDto,
  MedicalRecordUpdateDto,
} from "./medicalRecord.model";

describe("MedicalRecordService", () => {
  let medicalRecordService: MedicalRecordService;
  let medicalRecordRepositoryMock: jest.Mocked<MedicalRecordRepository>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let patientRepositoryMock: jest.Mocked<PatientRepository>;
  let appointmentRepositoryMock: jest.Mocked<AppointmentRepository>;
  let databaseServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    medicalRecordRepositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MedicalRecordRepository>;

    notificationServiceMock = {
      createNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    patientRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    appointmentRepositoryMock = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<AppointmentRepository>;

    databaseServiceMock = {
      execQuery: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    Container.set(MedicalRecordRepository, medicalRecordRepositoryMock);
    Container.set(NotificationService, notificationServiceMock);
    Container.set(PatientRepository, patientRepositoryMock);
    Container.set(AppointmentRepository, appointmentRepositoryMock);
    Container.set(DatabaseService, databaseServiceMock);

    medicalRecordService = Container.get(MedicalRecordService);
  });

  describe("getAllMedicalRecords", () => {
    it("should return all medical records based on criteria", async () => {
      const criteria = { patientId: 1 };
      const records: MedicalRecord[] = [
        {
          id: 1,
          patientId: 1,
          doctorId: 1,
          diagnosis: "Flu",
        },
      ];

      medicalRecordRepositoryMock.findAll.mockResolvedValueOnce(records);

      const result = await medicalRecordService.getAllMedicalRecords(criteria);

      expect(medicalRecordRepositoryMock.findAll).toHaveBeenCalledWith(
        criteria,
      );
      expect(result).toEqual(records);
    });
  });

  describe("getMedicalRecordById", () => {
    it("should return medical record by id", async () => {
      const record: MedicalRecord = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        diagnosis: "Flu",
      };

      medicalRecordRepositoryMock.findById.mockResolvedValueOnce(record);

      const result = await medicalRecordService.getMedicalRecordById(1);

      expect(medicalRecordRepositoryMock.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(record);
    });
  });

  describe("createMedicalRecord", () => {
    it("should create medical record", async () => {
      const createDto: MedicalRecordCreateDto = {
        patientId: 1,
        doctorId: 1,
        diagnosis: "Flu",
      };
      const createdRecord: MedicalRecord = { id: 1, ...createDto };

      medicalRecordRepositoryMock.create.mockResolvedValueOnce(createdRecord);

      const result = await medicalRecordService.createMedicalRecord(createDto);

      expect(medicalRecordRepositoryMock.create).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(createdRecord);
    });
  });

  describe("updateMedicalRecord", () => {
    it("should update medical record and send notification", async () => {
      const id = 1;
      const updateDto: MedicalRecordUpdateDto = { diagnosis: "Updated Flu" };
      const existingRecord: MedicalRecord = {
        id,
        patientId: 1,
        doctorId: 1,
        diagnosis: "Flu",
      };
      const updatedRecord = { ...existingRecord, ...updateDto };
      const patient = { id: 1, userId: 100 };

      medicalRecordRepositoryMock.findById.mockResolvedValueOnce(
        existingRecord,
      );
      medicalRecordRepositoryMock.update.mockResolvedValueOnce(updatedRecord);
      patientRepositoryMock.findById.mockResolvedValueOnce(patient as any);

      const result = await medicalRecordService.updateMedicalRecord(
        id,
        updateDto,
      );

      expect(medicalRecordRepositoryMock.update).toHaveBeenCalledWith(
        id,
        updateDto,
      );
      expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(result).toEqual(updatedRecord);
    });

    it("should return null if record not found", async () => {
      medicalRecordRepositoryMock.findById.mockResolvedValueOnce(null);

      const result = await medicalRecordService.updateMedicalRecord(1, {});

      expect(result).toBeNull();
    });
  });

  describe("deleteMedicalRecord", () => {
    it("should delete medical record", async () => {
      medicalRecordRepositoryMock.delete.mockResolvedValueOnce(true);

      const result = await medicalRecordService.deleteMedicalRecord(1);

      expect(medicalRecordRepositoryMock.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe("getPatientMedicalRecords", () => {
    it("should return patient medical records", async () => {
      const patientId = 1;
      const records: MedicalRecord[] = [
        { id: 1, patientId, doctorId: 1, diagnosis: "Flu" },
      ];

      databaseServiceMock.execQuery.mockResolvedValueOnce({
        rows: [{ id: patientId }],
      } as any);
      medicalRecordRepositoryMock.findAll.mockResolvedValueOnce(records);

      const result =
        await medicalRecordService.getPatientMedicalRecords(patientId);

      expect(result).toEqual(records);
    });

    it("should throw error if patient not found", async () => {
      databaseServiceMock.execQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        medicalRecordService.getPatientMedicalRecords(999),
      ).rejects.toThrow("Patient not found");
    });
  });

  describe("addTestResult", () => {
    it("should add test result", async () => {
      const recordId = 1;
      const data = {
        testType: "Blood Test",
        result: "Normal",
        date: "2023-10-10",
      };
      const record: MedicalRecord = {
        id: recordId,
        patientId: 1,
        doctorId: 1,
        diagnosis: "Checkup",
      };
      const patient = { id: 1, userId: 100 };

      medicalRecordRepositoryMock.findById.mockResolvedValueOnce(record);
      databaseServiceMock.execQuery.mockResolvedValueOnce({ lastID: 1 } as any);
      patientRepositoryMock.findById.mockResolvedValueOnce(patient as any);

      const result = await medicalRecordService.addTestResult(recordId, data);

      expect(databaseServiceMock.execQuery).toHaveBeenCalled();
      expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });
  });

  describe("addTreatment", () => {
    it("should add treatment", async () => {
      const recordId = 1;
      const data = { name: "Aspirin", duration: "7 days" };
      const record: MedicalRecord = {
        id: recordId,
        patientId: 1,
        doctorId: 1,
        diagnosis: "Flu",
      };

      medicalRecordRepositoryMock.findById.mockResolvedValueOnce(record);
      databaseServiceMock.execQuery.mockResolvedValueOnce({ lastID: 1 } as any);

      const result = await medicalRecordService.addTreatment(recordId, data);

      expect(databaseServiceMock.execQuery).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });
  });

  describe("updateTreatment", () => {
    it("should update treatment", async () => {
      const recordId = 1;
      const treatmentId = 1;
      const updateDto = { medication: "New Med" };
      const existingTreatment = {
        id: treatmentId,
        medicalRecordId: recordId,
        medication: "Old Med",
      };

      databaseServiceMock.execQuery
        .mockResolvedValueOnce({ rows: [existingTreatment] } as any)
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({
          rows: [{ ...existingTreatment, ...updateDto }],
        } as any);

      const result = await medicalRecordService.updateTreatment(
        recordId,
        treatmentId,
        updateDto,
      );

      expect(result).toHaveProperty("medication", "New Med");
    });
  });
});