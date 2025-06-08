import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { Between, FindOptionsWhere, Like, Repository } from 'typeorm';
import { AuditTrailQueryDto } from './dtos/audit-trail-query.dto';
import {
  ActivityLogItem,
  AuditLogsResponse,
} from './interfaces/audit-logs-response.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    private readonly usersService: UsersService,
  ) {}

  async log(
    userExternalId: string,
    module: string,
    action: string,
    description: string,
    refId?: string,
  ): Promise<void> {
    const log = this.activityLogRepo.create({
      user_ext_id: userExternalId,
      module,
      action,
      description,
      ref_id: refId,
    });
    await this.activityLogRepo.save(log);
  }

  async getAuditLogs(query: AuditTrailQueryDto): Promise<AuditLogsResponse> {
    const where: FindOptionsWhere<ActivityLog> = {};

    if (query.userExternalId) where.user_ext_id = query.userExternalId;
    if (query.module) where.module = Like(`%${query.module}%`);
    if (query.dateFrom && query.dateTo) {
      where.created_at = Between(
        new Date(query.dateFrom),
        new Date(query.dateTo),
      );
    }

    const skip = (query.pageNumber - 1) * query.displayPerPage;
    const take = query.displayPerPage;

    const [logs, total] = await this.activityLogRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    const uniqueUserExtIds = [...new Set(logs.map((log) => log.user_ext_id))];

    const userMap = new Map<string, string>();

    await Promise.all(
      uniqueUserExtIds.map(async (userExtId) => {
        const user = await this.usersService.findOne(userExtId);
        if (user) {
          const fullName = `${user.data.first_name} ${user.data.last_name}`;
          userMap.set(userExtId, fullName);
        }
      }),
    );

    const enrichedLogs: ActivityLogItem[] = logs.map((log) => ({
      ...log,
      user_name: userMap.get(log.user_ext_id) || null,
    }));

    const totalPages = Math.ceil(total / query.displayPerPage);

    return {
      status: {
        success: true,
        message: 'Successfully fetched data',
      },
      data: enrichedLogs,
      meta: {
        page: query.pageNumber,
        totalNumber: total,
        totalPages,
        displayPage: query.displayPerPage,
      },
    };
  }
}
