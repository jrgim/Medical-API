import { Service } from "typedi";
import { User, UserCreateDto, UserResponseDto } from "./user.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM users WHERE email = ?",
      params: [email],
    });
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM users WHERE id = ?",
      params: [id],
    });
    return result.rows[0] || null;
  }

  async create(userData: UserCreateDto): Promise<User> {
    await this.databaseService.execQuery({
      sql: "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      params: [userData.email, userData.password, userData.role],
    });

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM users WHERE id = last_insert_rowid()",
    });
    return result.rows[0];
  }

  async findAll(filters?: { role?: string }): Promise<UserResponseDto[]> {
    let sql =
      "SELECT id, email, role, is_active, created_at, updated_at FROM users";
    const params: any[] = [];

    if (filters?.role) {
      sql += " WHERE role = ?";
      params.push(filters.role);
    }

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }

  async search(query: string, role?: string): Promise<UserResponseDto[]> {
    let sql = `
      SELECT id, email, role, is_active, created_at, updated_at FROM users 
      WHERE (email LIKE ? OR id IN (
        SELECT user_id FROM patients WHERE first_name LIKE ? OR last_name LIKE ?
        UNION
        SELECT user_id FROM doctors WHERE first_name LIKE ? OR last_name LIKE ?
      ))
    `;
    const params: any[] = [
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
    ];

    if (role) {
      sql += " AND role = ?";
      params.push(role);
    }

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }
}