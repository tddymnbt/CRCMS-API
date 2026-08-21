import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Like, Repository } from 'typeorm';
import { ActivityLog } from '../../domain/entities/activity-log.entity';
import {
  ActivityLogsRepositoryPort,
  AuditLogFilter,
} from '../../domain/repositories/activity-logs.repository.port';

@Injectable()
export class TypeormActivityLogsRepository
  implements ActivityLogsRepositoryPort
{
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
  ) {}

  create(payload: Partial<ActivityLog>): ActivityLog {
    return this.activityLogRepo.create(payload);
  }

  save(log: ActivityLog): Promise<ActivityLog> {
    return this.activityLogRepo.save(log);
  }

  async findAndCount(filter: AuditLogFilter): Promise<[ActivityLog[], number]> {
    const where: FindOptionsWhere<ActivityLog> = {};

    if (filter.userExternalId) where.user_ext_id = filter.userExternalId;
    if (filter.module) where.module = Like(`%${filter.module}%`);
    if (filter.dateFrom && filter.dateTo) {
      where.created_at = Between(
        new Date(filter.dateFrom),
        new Date(filter.dateTo),
      );
    }

    return this.activityLogRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: filter.skip,
      take: filter.take,
    });
  }
}
