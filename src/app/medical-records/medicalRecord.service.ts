import { Service } from "typedi";
import { MedicalRecordRepository } from "./medicalRecord.repository";
import { NotificationService } from "../notifications/notification.service";
import { PatientRepository } from "../patients/patient.repository";
import { AppointmentRepository } from "../appointments/appointment.repository";
import { DatabaseService } from "../../database/database.service";
import { MedicalRecord, MedicalRecordCreateDto, MedicalRecordUpdateDto } from "./medicalRecord.model";
import { TestResult, TestResultCreateDto } from "./testResult.model";
import { Treatment, TreatmentCreateDto, TreatmentUpdateDto } from "./treatment.model";

@Service()
export class MedicalRecordService {
  constructor(
    private readonly medicalRecordRepository: MedicalRecordRepository,
    private readonly notificationService: NotificationService,
    private readonly patientRepository: PatientRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async getAppointmentsByDoctorAndPatient(doctorId: number, patientId: number) {
    return await this.appointmentRepository.findAll({ doctorId, patientId });
  }

  async getAllMedicalRecords(criteria: any): Promise<MedicalRecord[]> {
    return await this.medicalRecordRepository.findAll(criteria);
  }

  async getMedicalRecordById(id: number): Promise<MedicalRecord | null> {
    return await this.medicalRecordRepository.findById(id);
  }

  async createMedicalRecord(
    data: MedicalRecordCreateDto,
  ): Promise<MedicalRecord> {
    return await this.medicalRecordRepository.create(data);
  }

  async updateMedicalRecord(
    id: number,
    data: MedicalRecordUpdateDto,
  ): Promise<MedicalRecord | null> {
    const record = await this.medicalRecordRepository.findById(id);
    if (!record) return null;

    const updatedRecord = await this.medicalRecordRepository.update(id, data);

    if (updatedRecord) {
      const patient = await this.patientRepository.findById(record.patientId);
      if (patient && patient.userId) {
        await this.notificationService.createNotification({
          userId: patient.userId,
          title: "Medical Record Updated",
          message:
            "Your medical record has been updated by your doctor. Please review the changes in your profile.",
          type: "alert",
        });
      }
    }

    return updatedRecord;
  }

  async deleteMedicalRecord(id: number): Promise<boolean> {
    return await this.medicalRecordRepository.delete(id);
  }

  async getPatientMedicalRecords(patientId: number): Promise<MedicalRecord[]> {
    const patientCheck = await this.databaseService.execQuery({
      sql: "SELECT id FROM patients WHERE id = ?",
      params: [patientId],
    });

    if (patientCheck.rows.length === 0) {
      throw new Error("Patient not found");
    }

    return await this.medicalRecordRepository.findAll({ patientId });
  }

  async addTestResult(recordId: number, data: any): Promise<TestResult> {
    // Verify medical record exists
    const record = await this.medicalRecordRepository.findById(recordId);
    if (!record) {
      throw new Error("Medical Record not found");
    }

    const testResultData: TestResultCreateDto = {
      medicalRecordId: recordId,
      testName: data.testType,
      testDate: data.date ? new Date(data.date) : new Date(),
      result: data.result,
      notes: data.notes,
    };

    const result = await this.databaseService.execQuery({
      sql: `INSERT INTO testResults (medicalRecordId, testName, testDate, result, notes)
            VALUES (?, ?, ?, ?, ?)`,
      params: [
        testResultData.medicalRecordId,
        testResultData.testName,
        testResultData.testDate,
        testResultData.result || null,
        testResultData.notes || null,
      ],
    });

    const patient = await this.patientRepository.findById(record.patientId);
    if (patient && patient.userId) {
      await this.notificationService.createNotification({
        userId: patient.userId,
        title: "New Test Results Available",
        message: `The results of your test "${testResultData.testName}" are now available.`,
        type: "alert",
      });
    }

    return {
      id: result.lastID!,
      ...testResultData,
    };
  }

  async addTreatment(recordId: number, data: any): Promise<Treatment> {
    // Verify medical record exists
    const record = await this.medicalRecordRepository.findById(recordId);
    if (!record) {
      throw new Error("Medical Record not found");
    }

    const treatmentData: TreatmentCreateDto = {
      medicalRecordId: recordId,
      medication: data.name,
      duration: data.duration,
    };

    const result = await this.databaseService.execQuery({
      sql: `INSERT INTO treatments (medicalRecordId, medication, duration)
            VALUES (?, ?, ?)`,
      params: [
        treatmentData.medicalRecordId,
        treatmentData.medication,
        treatmentData.duration || null,
      ],
    });

    return {
      id: result.lastID!,
      ...treatmentData,
    };
  }

  async updateTreatment(
    recordId: number,
    treatmentId: number,
    data: TreatmentUpdateDto,
  ): Promise<Treatment | null> {
    // Verify treatment exists and belongs to the record
    const treatmentResult = await this.databaseService.execQuery({
      sql: "SELECT * FROM treatments WHERE id = ? AND medicalRecordId = ?",
      params: [treatmentId, recordId],
    });

    if (treatmentResult.rows.length === 0) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.medication) {
      updates.push("medication = ?");
      params.push(data.medication);
    }
    if (data.duration !== undefined) {
      updates.push("duration = ?");
      params.push(data.duration);
    }

    if (updates.length === 0) {
      return treatmentResult.rows[0] as Treatment;
    }

    params.push(treatmentId);

    await this.databaseService.execQuery({
      sql: `UPDATE treatments SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    const updated = await this.databaseService.execQuery({
      sql: "SELECT * FROM treatments WHERE id = ?",
      params: [treatmentId],
    });

    return updated.rows[0] as Treatment;
  }
}