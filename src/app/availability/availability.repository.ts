import { Service } from "typedi";
import {
  Availability,
  AvailabilityCreateDto,
  AvailabilityUpdateDto,
} from "./availability.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class AvailabilityRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByDoctorId(doctorId: number, startDate?: string, endDate?: string): Promise<Availability[]> {
    let sql = "SELECT * FROM availabilities WHERE doctorId = ?";
    const params: any[] = [doctorId];

    if (startDate && endDate) {
      sql += " AND startTime BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    sql += " ORDER BY startTime";

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }

  async bulkCreate(data: AvailabilityCreateDto[]): Promise<Availability[]> {
    const created: Availability[] = [];

    for (const item of data) {
      await this.databaseService.execQuery({
        sql: `
          INSERT INTO availabilities (
            doctorId, dayOfWeek, startTime, endTime, isAvailable
          ) VALUES (?, ?, ?, ?, ?)
        `,
        params: [
          item.doctorId,
          item.dayOfWeek,
          item.startTime,
          item.endTime,
          item.isAvailable !== undefined ? item.isAvailable : true,
        ],
      });

      const result = await this.databaseService.execQuery({
        sql: "SELECT * FROM availabilities WHERE id = last_insert_rowid()",
        params: [],
      });
      created.push(result.rows[0]);
    }

    return created;
  }

  async update(id: number, data: AvailabilityUpdateDto): Promise<Availability | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM availabilities WHERE id = ?",
      params: [id],
    });

    if (result.rows.length === 0) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.dayOfWeek !== undefined) {
      updates.push("dayOfWeek = ?");
      params.push(data.dayOfWeek);
    }
    if (data.startTime !== undefined) {
      updates.push("startTime = ?");
      params.push(data.startTime);
    }
    if (data.endTime !== undefined) {
      updates.push("endTime = ?");
      params.push(data.endTime);
    }
    if (data.isAvailable !== undefined) {
      updates.push("isAvailable = ?");
      params.push(data.isAvailable);
    }

    if (updates.length === 0) return result.rows[0];

    params.push(id);
    await this.databaseService.execQuery({
      sql: `UPDATE availabilities SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    const updated = await this.databaseService.execQuery({
      sql: "SELECT * FROM availabilities WHERE id = ?",
      params: [id],
    });
    return updated.rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM availabilities WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}