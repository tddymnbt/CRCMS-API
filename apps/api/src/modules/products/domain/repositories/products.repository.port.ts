import { Product } from '../entities/product.entity';
import { ProductCondition } from '../entities/product-condition.entity';
import { Stock } from '../entities/stock.entity';
import {
  FindConsignorProductsDto,
  FindProductsDto,
} from '../../application/dtos/find-all-products.dto';

export const PRODUCTS_REPOSITORY = Symbol('PRODUCTS_REPOSITORY');

export interface StockCountFilter {
  isConsigned?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface ProductsRepositoryPort {
  findProductByExtId(extId: string): Promise<Product | null>;
  findDuplicateProduct(
    name: string,
    categoryExtId: string,
    brandExtId: string,
    excludeExtId?: string,
  ): Promise<Product | null>;
  findProducts(dto: FindProductsDto): Promise<[Product[], number]>;
  findConsignorProducts(
    consignorExtId: string,
    dto: FindConsignorProductsDto,
  ): Promise<[Product[], number]>;
  createProduct(payload: Partial<Product>): Product;
  saveProduct(product: Product): Promise<Product>;
  softDeleteProduct(id: number): Promise<void>;

  findConditionByProductExtId(extId: string): Promise<ProductCondition | null>;
  createCondition(payload: Partial<ProductCondition>): ProductCondition;
  saveCondition(condition: ProductCondition): Promise<ProductCondition>;
  softDeleteCondition(id: number): Promise<void>;

  findStockByExtId(extId: string): Promise<Stock | null>;
  findStockByProductExtId(extId: string): Promise<Stock | null>;
  createStock(payload: Partial<Stock>): Stock;
  saveStock(stock: Stock): Promise<Stock>;
  softDeleteStock(id: number): Promise<void>;
  countStocks(filter: StockCountFilter): Promise<number>;
}
