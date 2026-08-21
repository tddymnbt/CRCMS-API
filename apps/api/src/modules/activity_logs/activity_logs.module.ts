import { forwardRef, Module } from '@nestjs/common';
import { ActivityLogsController } from './activity_logs.controller';
import { ActivityLog } from './domain/entities/activity-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ActivityLogsApplicationService } from './application/services/activity-logs.application.service';
import { ACTIVITY_LOGS_REPOSITORY } from './domain/repositories/activity-logs.repository.port';
import { TypeormActivityLogsRepository } from './infrastructure/repositories/typeorm-activity-logs.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsApplicationService,
    {
      provide: ACTIVITY_LOGS_REPOSITORY,
      useClass: TypeormActivityLogsRepository,
    },
  ],
  exports: [ActivityLogsApplicationService],
})
export class ActivityLogsModule {}
