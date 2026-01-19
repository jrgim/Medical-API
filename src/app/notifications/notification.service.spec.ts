import "reflect-metadata";
import { Container } from "typedi";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "./notification.repository";

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let notificationRepositoryMock: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    notificationRepositoryMock = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      markAsRead: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<NotificationRepository>;

    Container.set(NotificationRepository, notificationRepositoryMock);
    notificationService = Container.get(NotificationService);
  });

  describe("getUserNotifications", () => {
    it("should return all notifications for user", async () => {
      const notifications = [
        { id: 1, userId: 1, title: "Test", message: "Message" },
      ];

      notificationRepositoryMock.findByUserId.mockResolvedValueOnce(
        notifications as any,
      );

      const result = await notificationService.getUserNotifications(1);

      expect(result).toEqual(notifications);
    });
  });

  describe("createNotification", () => {
    it("should create notification", async () => {
      const createDto = {
        userId: 1,
        title: "Test",
        message: "Message",
        type: "alert" as const,
      };
      const created = { id: 1, ...createDto };

      notificationRepositoryMock.create.mockResolvedValueOnce(created as any);

      const result = await notificationService.createNotification(createDto);

      expect(result).toEqual(created);
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const updated = { id: 1, userId: 1, isRead: true };

      notificationRepositoryMock.markAsRead.mockResolvedValueOnce(
        updated as any,
      );

      const result = await notificationService.markAsRead(1);

      expect(result).toEqual(updated);
    });
  });

  describe("deleteNotification", () => {
    it("should delete notification", async () => {
      notificationRepositoryMock.delete.mockResolvedValueOnce(true);

      const result = await notificationService.deleteNotification(1);

      expect(result).toBe(true);
    });
  });
});