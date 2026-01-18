import { Service } from "typedi";
import { Notification as NotificationModel,NotificationCreateDto } from "./notification.model";
import { DatabaseService } from "../../database/database.service";

@Service()
export class NotificationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByUserId(userId: number): Promise<NotificationModel[]> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC",
      params: [userId],
    });
    return result.rows;
  }

  async create(data: NotificationCreateDto): Promise<NotificationModel> {
    const result = await this.databaseService.execQuery({
      sql: `
        INSERT INTO notifications (userId, title, message, type, isRead)
        VALUES (?, ?, ?, ?, ?)
      `,
      params: [
        data.userId,
        data.title,
        data.message,
        data.type || "info",
        data.isRead ? 1 : 0,
      ],
    });

    if (!result.lastID) {
      throw new Error("Failed to insert notification");
    }

    const notification = await this.databaseService.execQuery({
      sql: "SELECT * FROM notifications WHERE id = ?",
      params: [result.lastID],
    });

    return notification.rows[0];
  }

  async markAsRead(id: number): Promise<NotificationModel | null> {
    const result = await this.databaseService.execQuery({
      sql: "SELECT * FROM notifications WHERE id = ?",
      params: [id],
    });

    if (result.rows.length === 0) return null;

    await this.databaseService.execQuery({
      sql: "UPDATE notifications SET isRead = ? WHERE id = ?",
      params: [1, id],
    });

    const updated = await this.databaseService.execQuery({
      sql: "SELECT * FROM notifications WHERE id = ?",
      params: [id],
    });
    return updated.rows[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.databaseService.execQuery({
      sql: "DELETE FROM notifications WHERE id = ?",
      params: [id],
    });
    return result.rowCount > 0;
  }
}