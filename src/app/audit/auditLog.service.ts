import { Service } from "typedi";
import { AuditLogRepository } from "./auditLog.repository";
import { AuditLogCreateDto } from "./auditLog.model";

@Service()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async getAuditLogs(criteria: any) {
    return await this.auditLogRepository.findAll(criteria);
  }

  async getAuditLogById(id: number) {
    return await this.auditLogRepository.findById(id);
  }

  async logAction(userId: number | undefined, action: string, entityType: string, entityId?: number) {
    try {
      const data: AuditLogCreateDto = {
        userId: userId,
        action,
        entityType,
        entityId: entityId,
      };
      await this.auditLogRepository.create(data);
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }
}