import { Service } from "typedi";
import {
  MedicalRecord,
  MedicalRecordCreateDto,
  MedicalRecordUpdateDto,
} from "./medicalRecord.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class MedicalRecordRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(criteria: any = {}): Promise<MedicalRecord[]> {
    let sql = `
      SELECT 
        mr.*,
        p.firstName as patientFirstName,
        p.lastName as patientLastName,
        pu.email as patientEmail,
        d.licenseNumber as doctorLicense,
        du.email as doctorEmail,
        a.appointmentDate, a.appointmentTime
      FROM medicalRecords mr
      LEFT JOIN patients p ON mr.patientId = p.id
      LEFT JOIN users pu ON p.userId = pu.id
      LEFT JOIN doctors d ON mr.doctorId = d.id
      LEFT JOIN users du ON d.userId = du.id
      LEFT JOIN appointments a ON mr.appointmentId = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (criteria.patientId) {
      sql += " AND mr.patientId = ?";
      params.push(criteria.patientId);
    }
    if (criteria.doctorId) {
      sql += " AND mr.doctorId = ?";
      params.push(criteria.doctorId);
    }

    sql += " ORDER BY mr.createdAt DESC";

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }

  async findById(id: number): Promise<MedicalRecord | null> {
    const result = await this.databaseService.execQuery({
      sql: `
        SELECT 
          mr.*,
          p.firstName as patientFirstName,
          p.lastName as patientLastName,
          pu.email as patientEmail,
          d.licenseNumber as doctorLicense,
          du.email as doctorEmail,
          a.appointmentDate, a.appointmentTime
        FROM medicalRecords mr
        LEFT JOIN patients p ON mr.patientId = p.id
        LEFT JOIN users pu ON p.userId = pu.id
        LEFT JOIN doctors d ON mr.doctorId = d.id
        LEFT JOIN users du ON d.userId = du.id
        LEFT JOIN appointments a ON mr.appointmentId = a.id
        WHERE mr.id = ?
      `,
      params: [id],
    });
    return result.rows[0] || null;
  }

  async create(data: MedicalRecordCreateDto): Promise<MedicalRecord> {
    await this.databaseService.execQuery({
      sql: `
        INSERT INTO medicalRecords (
          patientId, doctorId, appointmentId, diagnosis, 
          notes
        ) VALUES (?, ?, ?, ?, ?)
      `,
      params: [
        data.patientId,
        data.doctorId,
        data.appointmentId || null,
        data.diagnosis,
        data.notes || null,
      ],
    });

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM medicalRecords WHERE id = last_insert_rowid()",
      params: [],
    });
    return result.rows[0];
  }

  async update(
    id: number,
    data: MedicalRecordUpdateDto
  ): Promise<MedicalRecord | null> {
    const record = await this.findById(id);
    if (!record) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fields = ["diagnosis", "treatmentPlan", "notes", "followUpDate"];

    fields.forEach((field) => {
      if (data[field as keyof MedicalRecordUpdateDto] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field as keyof MedicalRecordUpdateDto]);
      }
    });

    if (updates.length === 0) return record;

    params.push(id);
    await this.databaseService.execQuery({
      sql: `UPDATE medicalRecords SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM medicalRecords WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}