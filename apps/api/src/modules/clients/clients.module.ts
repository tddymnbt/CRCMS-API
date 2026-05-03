import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientBankDetail } from './entities/client-bank.entity';
import { UsersModule } from '../users/users.module';
import { SharedModule } from 'src/common/shared/shared.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
import { CLIENTS_REPOSITORY } from './domain/repositories/clients.repository.port';
import { TypeormClientsRepository } from './infrastructure/repositories/typeorm-clients.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientBankDetail]),
    UsersModule,
    SharedModule,
    ActivityLogsModule,
  ],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    {
      provide: CLIENTS_REPOSITORY,
      useClass: TypeormClientsRepository,
    },
  ],
  exports: [ClientsService],
})
export class ClientsModule {}
