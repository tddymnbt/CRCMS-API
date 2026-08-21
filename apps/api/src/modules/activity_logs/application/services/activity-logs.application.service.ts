import { Inject, Injectable } from '@nestjs/common';
import { AuditTrailQueryDto } from '../../application/dtos/audit-trail-query.dto';
import {
  ActivityLogItem,
  AuditLogsResponse,
} from '../../application/interfaces/audit-logs-response.interface';
import { UsersApplicationService } from '../../../users/application/services/users.application.service';
import {
  ACTIVITY_LOGS_REPOSITORY,
  ActivityLogsRepositoryPort,
} from '../../domain/repositories/activity-logs.repository.port';

@Injectable()
export class ActivityLogsApplicationService {
  constructor(
    @Inject(ACTIVITY_LOGS_REPOSITORY)
    private readonly activityLogRepository: ActivityLogsRepositoryPort,
    private readonly usersService: UsersApplicationService,
  ) {}

  async log(
    userExternalId: string,
    module: string,
    action: string,
    description: string,
    refId?: string,
  ): Promise<void> {
    const log = this.activityLogRepository.create({
      user_ext_id: userExternalId,
      module,
      action,
      description,
      ref_id: refId,
    });
    await this.activityLogRepository.save(log);
  }

  async getAuditLogs(query: AuditTrailQueryDto): Promise<AuditLogsResponse> {
    const skip = (query.pageNumber - 1) * query.displayPerPage;
    const take = query.displayPerPage;

    const [logs, total] = await this.activityLogRepository.findAndCount({
      userExternalId: query.userExternalId,
      module: query.module,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
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
