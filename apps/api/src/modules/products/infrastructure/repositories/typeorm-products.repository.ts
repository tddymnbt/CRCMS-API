import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { ProductCondition } from '../../domain/entities/product-condition.entity';
import { Stock } from '../../domain/entities/stock.entity';
import {
  ProductsRepositoryPort,
  StockCountFilter,
} from '../../domain/repositories/products.repository.port';
import {
  FindConsignorProductsDto,
  FindProductsDto,
} from '../../application/dtos/find-all-products.dto';

@Injectable()
export class TypeormProductsRepository implements ProductsRepositoryPort {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(ProductCondition)
    private readonly conditionRepo: Repository<ProductCondition>,

    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  findProductByExtId(extId: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { external_id: extId.trim() },
    });
  }

  findDuplicateProduct(
    name: string,
    categoryExtId: string,
    brandExtId: string,
    excludeExtId?: string,
  ): Promise<Product | null> {
    return this.productRepo.findOne({
      where: {
        name: ILike(name.trim()),
        category_ext_id: categoryExtId.trim(),
        brand_ext_id: brandExtId.trim(),
        ...(excludeExtId && { external_id: Not(excludeExtId.trim()) }),
      },
    });
  }

  async findProducts(dto: FindProductsDto): Promise<[Product[], number]> {
    const {
      searchValue,
      isConsigned,
      isOutOfStock,
      isLowStock,
      pageNumber,
      displayPerPage,
      sortBy,
      orderBy,
    } = dto;

    const query = this.productRepo.createQueryBuilder('product');

    const needsStockJoin =
      ['Y', 'y'].includes(isOutOfStock) || ['Y', 'y'].includes(isLowStock);

    if (needsStockJoin) {
      query.leftJoin(
        'stocks',
        'stock',
        'product.external_id = stock.product_ext_id',
      );
    }

    if (['Y', 'y'].includes(isOutOfStock)) {
      query.andWhere('stock.avail_qty = 0');
    }

    if (['Y', 'y'].includes(isLowStock)) {
      query
        .andWhere('stock.avail_qty <= stock.min_qty')
        .andWhere('stock.avail_qty > 0');
    }

    if (searchValue) {
      query.andWhere(
        `(product.name ILIKE :search OR product.material ILIKE :search OR product.hardware ILIKE :search OR product.code ILIKE :search OR product.measurement ILIKE :search OR product.model ILIKE :search)`,
        { search: `%${searchValue}%` },
      );
    }

    if (isConsigned) {
      query.andWhere('product.is_consigned = :isConsigned', {
        isConsigned: ['Y', 'y'].includes(isConsigned),
      });
    }

    query
      .orderBy(`product.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * displayPerPage)
      .take(displayPerPage);

    return query.getManyAndCount();
  }

  async findConsignorProducts(
    consignorExtId: string,
    dto: FindConsignorProductsDto,
  ): Promise<[Product[], number]> {
    const { searchValue, pageNumber, displayPerPage, sortBy, orderBy } = dto;

    const query = this.productRepo.createQueryBuilder('product');
    if (searchValue) {
      query.andWhere(
        `(product.name ILIKE :search OR product.material ILIKE :search OR product.hardware ILIKE :search OR product.code ILIKE :search OR product.measurement ILIKE :search OR product.model ILIKE :search)`,
        { search: `%${searchValue}%` },
      );
    }

    query
      .andWhere('product.is_consigned = true')
      .andWhere('product.consignor_ext_id = :consignorId', {
        consignorId: consignorExtId.trim(),
      });

    query
      .orderBy(`product.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * displayPerPage)
      .take(displayPerPage);

    return query.getManyAndCount();
  }

  createProduct(payload: Partial<Product>): Product {
    return this.productRepo.create(payload);
  }

  saveProduct(product: Product): Promise<Product> {
    return this.productRepo.save(product);
  }

  async softDeleteProduct(id: number): Promise<void> {
    await this.productRepo.softDelete(id);
  }

  findConditionByProductExtId(extId: string): Promise<ProductCondition | null> {
    return this.conditionRepo.findOne({
      where: { product_ext_id: extId.trim() },
    });
  }

  createCondition(payload: Partial<ProductCondition>): ProductCondition {
    return this.conditionRepo.create(payload);
  }

  saveCondition(condition: ProductCondition): Promise<ProductCondition> {
    return this.conditionRepo.save(condition);
  }

  async softDeleteCondition(id: number): Promise<void> {
    await this.conditionRepo.softDelete(id);
  }

  findStockByExtId(extId: string): Promise<Stock | null> {
    return this.stockRepo.findOne({
      where: { external_id: extId.trim() },
    });
  }

  findStockByProductExtId(extId: string): Promise<Stock | null> {
    return this.stockRepo.findOne({
      where: { product_ext_id: extId.trim() },
    });
  }

  createStock(payload: Partial<Stock>): Stock {
    return this.stockRepo.create(payload);
  }

  saveStock(stock: Stock): Promise<Stock> {
    return this.stockRepo.save(stock);
  }

  async softDeleteStock(id: number): Promise<void> {
    await this.stockRepo.softDelete(id);
  }

  countStocks(filter: StockCountFilter): Promise<number> {
    const where: FindOptionsWhere<Stock> = {
      deleted_at: null,
    };

    if (filter.isConsigned === true) {
      where.is_consigned = filter.isConsigned;
    }
    if (filter.createdFrom !== undefined && filter.createdTo !== undefined) {
      where.created_at = Between(filter.createdFrom, filter.createdTo);
    } else if (filter.createdFrom !== undefined) {
      where.created_at = MoreThanOrEqual(filter.createdFrom);
    }

    return this.stockRepo.count({ where });
  }
}
