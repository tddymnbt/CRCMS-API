import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { Sales } from './entities/sales.entity';
import { SalesItems } from './entities/sale-items.entity';
import { PaymentLogs } from './entities/payment-logs.entity';
import { SaleLayaways } from './entities/sale-layaways.entity';
import { UsersModule } from '../users/users.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sales, SalesItems, SaleLayaways, PaymentLogs]),
    ClientsModule,
    ProductsModule,
    UsersModule,
    ActivityLogsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
