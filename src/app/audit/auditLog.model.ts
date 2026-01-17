export interface AuditLog {
  id?: number;
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  createdAt?: Date;
}

export interface AuditLogCreateDto {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
}