import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientBankDetail } from './entities/client-bank.entity';
import { UsersModule } from '../users/users.module';
import { SharedModule } from 'src/common/shared/shared.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientBankDetail]),
    UsersModule,
    SharedModule,
    ActivityLogsModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
