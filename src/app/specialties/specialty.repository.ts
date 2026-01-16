import { Service } from "typedi";
import { Specialty, SpecialtyCreateDto } from "./specialty.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class SpecialtyRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Specialty[]> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM specialties ORDER BY name",
      params: [],
    });
    return result.rows;
  }

  async findById(id: number): Promise<Specialty | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM specialties WHERE id = ?",
      params: [id],
    });
    return result.rows[0] || null;
  }

  async create(data: SpecialtyCreateDto): Promise<Specialty> {
    await this.databaseService.execQuery({
      sql: "INSERT INTO specialties (name, description) VALUES (?, ?)",
      params: [data.name, data.description || null],
    });

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM specialties WHERE id = last_insert_rowid()",
      params: [],
    });
    return result.rows[0];
  }

  async update(id: number, data: Partial<SpecialtyCreateDto>): Promise<Specialty | null> {
    const specialty = await this.findById(id);
    if (!specialty) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      params.push(data.description);
    }

    if (updates.length === 0) return specialty;

    params.push(id);
    await this.databaseService.execQuery({
      sql: `UPDATE specialties SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM specialties WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}