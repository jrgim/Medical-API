import { Service } from "typedi";
import { Appointment,AppointmentCreateDto,AppointmentUpdateDto } from "./appointment.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class AppointmentRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(criteria: any = {}): Promise<Appointment[]> {
    let sql = `
      SELECT 
        a.*,
        p.firstName as patientFirstName,
        p.lastName as patientLastName,
        pu.email as patientEmail,
        d.licenseNumber as doctorLicense,
        du.email as doctorEmail
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN users pu ON p.userId = pu.id
      LEFT JOIN doctors d ON a.doctorId = d.id
      LEFT JOIN users du ON d.userId = du.id
    `;

    const params: any[] = [];
    const whereClauses: string[] = [];

    if (criteria.patientId) {
      whereClauses.push("a.patientId = ?");
      params.push(criteria.patientId);
    }
    if (criteria.doctorId) {
      whereClauses.push("a.doctorId = ?");
      params.push(criteria.doctorId);
    }
    if (criteria.status) {
      whereClauses.push("a.status = ?");
      params.push(criteria.status);
    }

    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    sql += " ORDER BY a.appointmentDate DESC, a.appointmentTime DESC";

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }

  async findById(id: number): Promise<Appointment | null> {
    const result = await this.databaseService.execQuery({
      sql: `
        SELECT 
          a.*,
          p.firstName as patientFirstName,
          p.lastName as patientLastName,
          pu.email as patientEmail,
          d.licenseNumber as doctorLicense,
          du.email as doctorEmail
        FROM appointments a
        LEFT JOIN patients p ON a.patientId = p.id
        LEFT JOIN users pu ON p.userId = pu.id
        LEFT JOIN doctors d ON a.doctorId = d.id
        LEFT JOIN users du ON d.userId = du.id
        WHERE a.id = ?
      `,
      params: [id],
    });
    return result.rows[0] || null;
  }

  async create(data: AppointmentCreateDto): Promise<Appointment> {
    const result = await this.databaseService.execQuery({
      sql: `
        INSERT INTO appointments (
          patientId, doctorId, appointmentDate, appointmentTime,
          status, reason
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      params: [
        data.patientId,
        data.doctorId,
        data.appointmentDate,
        data.appointmentTime,
        data.status || "scheduled",
        data.reason || null,
      ],
    });

    if (!result.lastID) {
      throw new Error("Failed to insert appointment");
    }

    const appointment = await this.databaseService.execQuery({
      sql: "SELECT * FROM appointments WHERE id = ?",
      params: [result.lastID],
    });

    return appointment.rows[0];
  }

  async update(
    id: number,
    data: AppointmentUpdateDto,
  ): Promise<Appointment | null> {
    const appointment = await this.findById(id);
    if (!appointment) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fields = ["appointmentDate", "appointmentTime", "status", "reason"];

    fields.forEach((field) => {
      if (data[field as keyof AppointmentUpdateDto] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field as keyof AppointmentUpdateDto]);
      }
    });

    if (updates.length === 0) return appointment;

    params.push(id);
    await this.databaseService.execQuery({
      sql: `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM appointments WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}