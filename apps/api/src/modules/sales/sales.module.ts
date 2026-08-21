import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { Sales } from './domain/entities/sales.entity';
import { SalesItems } from './domain/entities/sale-items.entity';
import { SaleLayaways } from './domain/entities/sale-layaways.entity';
import { PaymentLogs } from './domain/entities/payment-logs.entity';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
import { SalesApplicationService } from './application/services/sales.application.service';
import { SALES_REPOSITORY } from './domain/repositories/sales.repository.port';
import { TypeormSalesRepository } from './infrastructure/repositories/typeorm-sales.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sales, SalesItems, SaleLayaways, PaymentLogs]),
    ClientsModule,
    ProductsModule,
    UsersModule,
    ActivityLogsModule,
  ],
  controllers: [SalesController],
  providers: [
    SalesApplicationService,
    {
      provide: SALES_REPOSITORY,
      useClass: TypeormSalesRepository,
    },
  ],
  exports: [SalesApplicationService],
})
export class SalesModule {}
