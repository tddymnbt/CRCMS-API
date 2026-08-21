import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';
import { BrandsController } from './brands.controller';
import { AuthenticatorsController } from './authenticators.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './domain/entities/product-category.entity';
import { ProductBrand } from './domain/entities/product-brand.entity';
import { ProductAuthenticator } from './domain/entities/product-authenticator.entity';
import { Product } from './domain/entities/product.entity';
import { ProductCondition } from './domain/entities/product-condition.entity';
import { Stock } from './domain/entities/stock.entity';
import { ClientsModule } from '../clients/clients.module';
import { StockMovementApplicationService } from './application/services/stock-movement.application.service';
import { StockMovement } from './domain/entities/stock-movement.entity';
import { UsersModule } from '../users/users.module';
import { SharedModule } from 'src/common/shared/shared.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
import { ProductsApplicationService } from './application/services/products.application.service';
import { CategoriesApplicationService } from './application/services/categories.application.service';
import { BrandsApplicationService } from './application/services/brands.application.service';
import { AuthenticatorsApplicationService } from './application/services/authenticators.application.service';
import { PRODUCTS_REPOSITORY } from './domain/repositories/products.repository.port';
import { TypeormProductsRepository } from './infrastructure/repositories/typeorm-products.repository';
import {
  AUTHENTICATORS_REPOSITORY_PROVIDER,
  BRANDS_REPOSITORY_PROVIDER,
  CATEGORIES_REPOSITORY_PROVIDER,
} from './infrastructure/repositories/typeorm-product-misc.repository';
import { STOCK_MOVEMENTS_REPOSITORY } from './domain/repositories/stock-movements.repository.port';
import { TypeormStockMovementsRepository } from './infrastructure/repositories/typeorm-stock-movements.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCategory,
      ProductBrand,
      ProductAuthenticator,
      Product,
      ProductCondition,
      Stock,
      StockMovement,
    ]),
    ClientsModule,
    UsersModule,
    SharedModule,
    ActivityLogsModule,
  ],
  controllers: [
    ProductsController,
    CategoriesController,
    BrandsController,
    AuthenticatorsController,
  ],
  providers: [
    ProductsApplicationService,
    CategoriesApplicationService,
    BrandsApplicationService,
    AuthenticatorsApplicationService,
    StockMovementApplicationService,
    {
      provide: PRODUCTS_REPOSITORY,
      useClass: TypeormProductsRepository,
    },
    BRANDS_REPOSITORY_PROVIDER,
    CATEGORIES_REPOSITORY_PROVIDER,
    AUTHENTICATORS_REPOSITORY_PROVIDER,
    {
      provide: STOCK_MOVEMENTS_REPOSITORY,
      useClass: TypeormStockMovementsRepository,
    },
  ],
  exports: [
    ProductsApplicationService,
    CategoriesApplicationService,
    BrandsApplicationService,
    AuthenticatorsApplicationService,
    StockMovementApplicationService,
  ],
})
export class ProductsModule {}
