import "reflect-metadata";
import { Container } from "typedi";
import { AuditLogService } from "./auditLog.service";
import { AuditLogRepository } from "./auditLog.repository";

describe("AuditLogService", () => {
  let auditLogService: AuditLogService;
  let auditLogRepositoryMock: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    Container.reset();

    auditLogRepositoryMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByUserId: jest.fn(),
      findByEntity: jest.fn(),
    } as unknown as jest.Mocked<AuditLogRepository>;

    Container.set(AuditLogRepository, auditLogRepositoryMock);
    auditLogService = Container.get(AuditLogService);
  });

  describe("logAction", () => {
    it("should create audit log", async () => {
      const auditLog = {
        id: 1,
        userId: 1,
        action: "CREATE",
        entity: "patient",
        entityId: 1,
      };

      auditLogRepositoryMock.create.mockResolvedValueOnce(auditLog as any);

      await auditLogService.logAction(1, "CREATE", "patient", 1);

      expect(auditLogRepositoryMock.create).toHaveBeenCalled();
    });
  });

  describe("getAllAuditLogs", () => {
    it("should return all audit logs", async () => {
      const logs = [{ id: 1, userId: 1, action: "CREATE" }];

      auditLogRepositoryMock.findAll.mockResolvedValueOnce(logs as any);

      const result = await auditLogService.getAuditLogs({});

      expect(result).toEqual(logs);
    });
  });

  describe("getAuditLogsByUserId", () => {
    it("should return audit logs by user id", async () => {
      const logs = [{ id: 1, userId: 1, action: "CREATE" }];

      auditLogRepositoryMock.findAll.mockResolvedValueOnce(logs as any);

      const result = await auditLogService.getAuditLogs({ userId: 1 });

      expect(result).toEqual(logs);
    });
  });
});