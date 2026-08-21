import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './domain/entities/client.entity';
import { ClientBankDetail } from './domain/entities/client-bank.entity';
import { UsersModule } from '../users/users.module';
import { SharedModule } from 'src/common/shared/shared.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
import { CLIENTS_REPOSITORY } from './domain/repositories/clients.repository.port';
import { TypeormClientsRepository } from './infrastructure/repositories/typeorm-clients.repository';
import { ClientsApplicationService } from './application/services/clients.application.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientBankDetail]),
    UsersModule,
    SharedModule,
    ActivityLogsModule,
  ],
  controllers: [ClientsController],
  providers: [
    ClientsApplicationService,
    {
      provide: CLIENTS_REPOSITORY,
      useClass: TypeormClientsRepository,
    },
  ],
  exports: [ClientsApplicationService],
})
export class ClientsModule {}
