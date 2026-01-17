import { Service } from "typedi";
import { AuditLog, AuditLogCreateDto } from "./auditLog.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class AuditLogRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(criteria: any = {}): Promise<AuditLog[]> {
    let sql = `
      SELECT 
        al.*,
        u.email as userEmail,
        u.role as userRole
      FROM auditLogs al
      LEFT JOIN users u ON al.userId = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (criteria.userId) {
      sql += " AND al.userId = ?";
      params.push(criteria.userId);
    }
    if (criteria.action) {
      sql += " AND al.action = ?";
      params.push(criteria.action);
    }
    if (criteria.entityType) {
      sql += " AND al.entityType = ?";
      params.push(criteria.entityType);
    }
    if (criteria.startDate && criteria.endDate) {
      sql += " AND al.createdAt BETWEEN ? AND ?";
      params.push(criteria.startDate, criteria.endDate);
    } else if (criteria.startDate) {
      sql += " AND al.createdAt >= ?";
      params.push(criteria.startDate);
    } else if (criteria.endDate) {
      sql += " AND al.createdAt <= ?";
      params.push(criteria.endDate);
    }

    sql += " ORDER BY al.createdAt DESC";

    const result = await this.databaseService.execQuery({ sql, params });
    return result.rows;
  }

  async findById(id: number): Promise<AuditLog | null> {
    const result = await this.databaseService.execQuery({
      sql: `
        SELECT 
          al.*,
          u.email as userEmail,
          u.role as userRole
        FROM auditLogs al
        LEFT JOIN users u ON al.userId = u.id
        WHERE al.id = ?
      `,
      params: [id],
    });
    return result.rows[0] || null;
  }

  async create(data: AuditLogCreateDto): Promise<AuditLog> {
    await this.databaseService.execQuery({
      sql: `
        INSERT INTO auditLogs (userId, action, entityType, entityId)
        VALUES (?, ?, ?, ?)
      `,
      params: [data.userId, data.action, data.entityType, data.entityId || null],
    });

    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM auditLogs WHERE id = last_insert_rowid()",
      params: [],
    });
    return result.rows[0];
  }
}