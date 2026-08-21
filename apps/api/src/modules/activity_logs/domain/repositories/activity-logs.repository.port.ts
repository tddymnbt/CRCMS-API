import { ActivityLog } from '../entities/activity-log.entity';

export const ACTIVITY_LOGS_REPOSITORY = Symbol('ACTIVITY_LOGS_REPOSITORY');

export interface AuditLogFilter {
  userExternalId?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  skip: number;
  take: number;
}

export interface ActivityLogsRepositoryPort {
  create(payload: Partial<ActivityLog>): ActivityLog;
  save(log: ActivityLog): Promise<ActivityLog>;
  findAndCount(filter: AuditLogFilter): Promise<[ActivityLog[], number]>;
}
