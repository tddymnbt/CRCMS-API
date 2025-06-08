import { forwardRef, Module } from '@nestjs/common';
import { ActivityLogsService } from './activity_logs.service';
import { ActivityLogsController } from './activity_logs.controller';
import { ActivityLog } from './entities/activity-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
