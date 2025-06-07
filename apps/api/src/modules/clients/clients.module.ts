import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientBankDetail } from './entities/client-bank.entity';
import { UsersModule } from '../users/users.module';
import { SharedModule } from 'src/common/shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientBankDetail]),
    UsersModule,
    SharedModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
