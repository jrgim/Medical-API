import { Service } from "typedi";
import { NotificationRepository } from "./notification.repository";
import { Notification, NotificationCreateDto } from "./notification.model";

@Service()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await this.notificationRepository.findByUserId(userId);
  }

  async createNotification(data: NotificationCreateDto): Promise<Notification> {
    return await this.notificationRepository.create(data);
  }

  async markAsRead(id: number): Promise<Notification | null> {
    return await this.notificationRepository.markAsRead(id);
  }

  async deleteNotification(id: number): Promise<boolean> {
    return await this.notificationRepository.delete(id);
  }
}