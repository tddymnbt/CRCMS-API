import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { BrandsController } from './controllers/brands.controller';
import { AuthenticatorsController } from './controllers/authenticators.controller';
import { CategoriesService } from './services/categories.service';
import { BrandsService } from './services/brands.service';
import { AuthenticatorsService } from './services/authenticators.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { ProductBrand } from './entities/product-brand.entity';
import { ProductAuthenticator } from './entities/product-authenticator.entity';
import { Product } from './entities/product.entity';
import { ProductCondition } from './entities/product-condition.entity';
import { Stock } from './entities/stock.entity';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCategory,
      ProductBrand,
      ProductAuthenticator,
      Product,
      ProductCondition,
      Stock,
    ]),
    ClientsModule,
  ],
  controllers: [
    ProductsController,
    CategoriesController,
    BrandsController,
    AuthenticatorsController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    BrandsService,
    AuthenticatorsService,
  ],
  exports: [
    ProductsService,
    CategoriesService,
    BrandsService,
    AuthenticatorsService,
  ],
})
export class ProductsModule {}
