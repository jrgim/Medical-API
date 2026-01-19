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

  async findByDoctorId(
    doctorId: number,
    date?: string,
  ): Promise<Availability[]> {
    let sql = "SELECT * FROM availabilities WHERE doctorId = ?";
    const params: any[] = [doctorId];

    if (date) {
      sql += " AND date = ?";
      params.push(date);
    }

    sql += " ORDER BY date, time";

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }

  async bulkCreate(data: AvailabilityCreateDto[]): Promise<Availability[]> {
    const created: Availability[] = [];
    const insertedIds: number[] = [];

    for (const item of data) {
      const insertResult = await this.databaseService.execQuery({
        sql: `
          INSERT INTO availabilities (
            doctorId, date, time, isAvailable
          ) VALUES (?, ?, ?, ?)
        `,
        params: [
          item.doctorId,
          item.date,
          item.time,
          item.isAvailable !== undefined ? item.isAvailable : true,
        ],
      });

      if (insertResult.lastID) {
        insertedIds.push(insertResult.lastID);
      }
    }

    if (insertedIds.length > 0) {
      const placeholders = insertedIds.map(() => "?").join(",");
      const result = await this.databaseService.execQuery({
        sql: `SELECT * FROM availabilities WHERE id IN (${placeholders})`,
        params: insertedIds,
      });
      return result.rows;
    }

    return created;
  }

  async update(
    id: number,
    data: AvailabilityUpdateDto,
  ): Promise<Availability | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM availabilities WHERE id = ?",
      params: [id],
    });

    if (result.rows.length === 0) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.date !== undefined) {
      updates.push("date = ?");
      params.push(data.date);
    }
    if (data.time !== undefined) {
      updates.push("time = ?");
      params.push(data.time);
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

  async updateAvailabilityStatus(
    doctorId: number,
    date: string,
    time: string,
    isAvailable: boolean,
  ): Promise<void> {
    await this.databaseService.execQuery({
      sql: `UPDATE availabilities 
            SET isAvailable = ? 
            WHERE doctorId = ? AND date = ? AND time = ?`,
      params: [isAvailable ? 1 : 0, doctorId, date, time],
    });
  }
}
