import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogsApplicationService } from './application/services/activity-logs.application.service';
import { AuditTrailQueryDto } from './application/dtos/audit-trail-query.dto';
import { ActivityLogListResponseDto } from './application/dtos/activity-log.response.dto';
import { ApiValidationError } from 'src/common/swagger/api-error-responses.decorator';

@ApiTags('activity logs')
@Controller('logs')
export class ActivityLogsController {
  constructor(
    private readonly activityLogsService: ActivityLogsApplicationService,
  ) {}

  @Get('activity')
  @ApiOperation({ summary: 'Find all activity logs' })
  @ApiOkResponse({
    description: 'Paginated audit trail of user activity',
    type: ActivityLogListResponseDto,
  })
  @ApiValidationError()
  getAuditLogs(
    @Query() query: AuditTrailQueryDto,
  ): Promise<ActivityLogListResponseDto> {
    return this.activityLogsService.getAuditLogs(query);
  }
}
