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
    const insertResult = await this.databaseService.execQuery({
      sql: "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      params: [userData.email, userData.password, userData.role],
    });

    if (!insertResult.lastID) {
      throw new Error("Failed to insert user into database");
    }

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM users WHERE id = ?",
      params: [insertResult.lastID],
    });

    if (!result.rows[0]) {
      throw new Error("Failed to retrieve created user");
    }

    return result.rows[0];
  }

  async findAll(filters?: { role?: string }): Promise<UserResponseDto[]> {
    let sql =
      "SELECT id, email, role, isActive, createdAt, updatedAt FROM users";
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
      SELECT id, email, role, isActive, createdAt, updatedAt FROM users 
      WHERE (email LIKE ? OR id IN (
        SELECT userId FROM patients WHERE firstName LIKE ? OR lastName LIKE ?
        UNION
        SELECT userId FROM doctors WHERE firstName LIKE ? OR lastName LIKE ?
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