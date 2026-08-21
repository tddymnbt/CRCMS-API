import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { StatusApplicationService } from './application/services/status.application.service';

@Module({
  controllers: [StatusController],
  providers: [StatusApplicationService],
})
export class StatusModule {}
