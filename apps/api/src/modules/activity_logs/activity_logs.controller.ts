import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity_logs.service';
import { AuditTrailQueryDto } from './dtos/audit-trail-query.dto';
import { AuditLogsResponse } from './interfaces/audit-logs-response.interface';

@Controller('logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('activity')
  getAuditLogs(@Query() query: AuditTrailQueryDto): Promise<AuditLogsResponse> {
    return this.activityLogsService.getAuditLogs(query);
  }
}
