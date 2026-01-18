import { Service } from "typedi";
import { Patient, PatientCreateDto, PatientUpdateDto } from "./patient.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class PatientRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Patient[]> {
    const result = await this.databaseService.execQuery({
      sql: `
        SELECT 
          p.*,
          u.email, u.role, u.isActive,
          u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt
        FROM patients p
        LEFT JOIN users u ON p.userId = u.id
        ORDER BY p.id DESC
      `,
      params: [],
    });
    return result.rows;
  }

  async findById(id: number): Promise<Patient | null> {
    const result = await this.databaseService.execQuery({
      sql: `
        SELECT 
          p.*,
          u.email, u.role, u.isActive,
          u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt
        FROM patients p
        LEFT JOIN users u ON p.userId = u.id
        WHERE p.id = ?
      `,
      params: [id],
    });
    return result.rows[0] || null;
  }

  async findByUserId(userId: number): Promise<Patient | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM patients WHERE userId = ?",
      params: [userId],
    });
    return result.rows[0] || null;
  }

  async findPatientsByDoctorId(doctorId: number): Promise<Patient[]> {
    const result = await this.databaseService.execQuery({
      sql: `
        SELECT DISTINCT
          p.*,
          u.email, u.role, u.isActive,
          u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt
        FROM patients p
        LEFT JOIN users u ON p.userId = u.id
        INNER JOIN appointments a ON p.id = a.patientId
        WHERE a.doctorId = ?
        ORDER BY p.id DESC
      `,
      params: [doctorId],
    });
    return result.rows;
  }

  async create(patientData: PatientCreateDto): Promise<Patient> {
    await this.databaseService.execQuery({
      sql: `
        INSERT INTO patients (
          userId, firstName, lastName, dateOfBirth, gender, 
          phone, address, city, postalCode, country, allergies
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        patientData.userId,
        patientData.firstName,
        patientData.lastName,
        patientData.dateOfBirth,
        patientData.gender,
        patientData.phone,
        patientData.address || null,
        patientData.city || null,
        patientData.postalCode || null,
        patientData.country || null,
        patientData.allergies || null,
      ],
    });

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM patients WHERE id = last_insert_rowid()",
      params: [],
    });
    return result.rows[0];
  }

  async update(
    id: number,
    patientData: PatientUpdateDto
  ): Promise<Patient | null> {
    const patient = await this.findById(id);
    if (!patient) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "phone",
      "address",
      "city",
      "postalCode",
      "country",
      "allergies",
    ];

    fields.forEach((field) => {
      if (patientData[field as keyof PatientUpdateDto] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(patientData[field as keyof PatientUpdateDto]);
      }
    });

    if (updates.length === 0) return patient;

    params.push(id);
    await this.databaseService.execQuery({
      sql: `UPDATE patients SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM patients WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}