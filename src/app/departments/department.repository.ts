import { Service } from "typedi";
import { Department, DepartmentCreateDto } from "./department.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class DepartmentRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Department[]> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM departments ORDER BY name",
      params: [],
    });
    return result.rows;
  }

  async findById(id: number): Promise<Department | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM departments WHERE id = ?",
      params: [id],
    });
    return result.rows[0] || null;
  }

  async create(data: DepartmentCreateDto): Promise<Department> {
    await this.databaseService.execQuery({
      sql: "INSERT INTO departments (name, description) VALUES (?, ?)",
      params: [data.name, data.description || null],
    });

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM departments WHERE id = last_insert_rowid()",
      params: [],
    });
    return result.rows[0];
  }

  async update(id: number, data: Partial<DepartmentCreateDto>): Promise<Department | null> {
    const dept = await this.findById(id);
    if (!dept) return null;

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

    if (updates.length === 0) return dept;

    params.push(id);
    await this.databaseService.execQuery({
      sql: `UPDATE departments SET ${updates.join(", ")} WHERE id = ?`,
      params,
    });

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM departments WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}