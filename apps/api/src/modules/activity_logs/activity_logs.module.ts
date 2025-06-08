import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity_logs.service';
import { ActivityLogsController } from './activity_logs.controller';
import { ActivityLog } from './entities/activity-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
