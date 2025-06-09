import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { ProductCondition } from '../entities/product-condition.entity';
import { Stock } from '../entities/stock.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { CategoriesService } from './categories.service';
import { BrandsService } from './brands.service';
import { AuthenticatorsService } from './authenticators.service';
import {
  IPMiscsResponse,
  IProduct,
  IProductCount,
  IProductResponse,
  IProductsResponse,
} from '../interfaces/product.interface';
import { ClientsService } from 'src/modules/clients/clients.service';
import {
  FindConsignorProductsDto,
  FindProductsDto,
} from '../dtos/find-all-products.dto';
import { StockMovementService } from './stock-movement.service';
import {
  UpdateProductStockDto,
  UpdateStockFromSaleDto,
} from '../dtos/update-p-stock.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { UsersService } from 'src/modules/users/users.service';
import * as moment from 'moment';
import { SharedService } from 'src/common/shared/shared.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly pCategoryService: CategoriesService,
    private readonly pBrandService: BrandsService,
    private readonly pAuthenticatorService: AuthenticatorsService,
    private readonly clientService: ClientsService,
    private readonly stockMovementService: StockMovementService,
    private readonly userService: UsersService,
    private readonly sharedService: SharedService,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(ProductCondition)
    private readonly conditionRepo: Repository<ProductCondition>,

    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  async validateMisc(
    category_ext_id: string,
    brand_ext_id: string,
    auth_ext_id?: string,
    consignor_ext_id?: string,
  ): Promise<IPMiscsResponse> {
    const [category, brand] = await Promise.all([
      this.pCategoryService.findOne(category_ext_id.trim()),
      this.pBrandService.findOne(brand_ext_id.trim()),
    ]);

    const authenticator = auth_ext_id
      ? await this.pAuthenticatorService.findOne(auth_ext_id.trim())
      : null;

    const consignor = consignor_ext_id
      ? await this.clientService.findOne(consignor_ext_id.trim())
      : null;

    return {
      category_data: category.data,
      brand_data: brand.data,
      authenticator_data: authenticator?.data ?? null,
      consignor_data: consignor?.data ?? null,
    };
  }

  async checkDuplicateProduct(
    name: string,
    category: string,
    brand: string,
    ext_id?: string,
  ): Promise<boolean> {
    const where: FindOptionsWhere<Product> = {
      name: ILike(name.trim()),
      category_ext_id: category.trim(),
      brand_ext_id: brand.trim(),
      ...(ext_id && { external_id: Not(ext_id.trim()) }),
    };

    const checkDuplicate = await this.productRepo.findOne({ where });

    if (checkDuplicate) {
      throw new ConflictException({
        status: { success: false, message: 'Product already exists' },
      });
    }

    return false;
  }

  async createProduct(dto: CreateProductDto): Promise<IProductResponse> {
    if (!dto.is_consigned) {
      dto.consignor_ext_id = null;
      dto.consignor_selling_price = null;
      dto.consigned_date = null;
    } else {
      const throwIfMissing = (
        field: string | number,
        message: string,
      ): void => {
        if (!field) {
          throw new BadRequestException({
            status: { success: false, message },
          });
        }
      };

      throwIfMissing(
        dto.consignor_ext_id,
        'Consignor external ID is required if product is consigned.',
      );
      throwIfMissing(
        dto.consignor_selling_price,
        'Consignor selling price is required if product is consigned.',
      );
      throwIfMissing(
        dto.consigned_date,
        'Consigned date is required if product is consigned.',
      );
    }

    const miscVals = await this.validateMisc(
      dto.category_ext_id,
      dto.brand_ext_id,
      dto.auth_ext_id,
      dto.consignor_ext_id,
    );
    await this.checkDuplicateProduct(
      dto.name,
      dto.category_ext_id,
      dto.brand_ext_id,
    );

    const product_ext_id = generateUniqueId(10);
    const condition_ext_id = generateUniqueId(10);
    const stock_ext_id = generateUniqueId(10);

    // Create Product
    const product = this.productRepo.create({
      category_ext_id: dto.category_ext_id,
      brand_ext_id: dto.brand_ext_id,
      external_id: product_ext_id,
      name: dto.name,
      material: dto.material,
      hardware: dto.hardware,
      code: dto.code,
      measurement: dto.measurement,
      model: dto.model,
      auth_ext_id: dto.auth_ext_id,
      inclusion: dto.inclusion,
      images: dto.images,
      condition_ext_id,
      cost: dto.cost,
      price: dto.price,
      is_consigned: dto.is_consigned,
      consignor_ext_id: dto.consignor_ext_id,
      consignor_selling_price: dto.consignor_selling_price,
      created_by: dto.created_by,
    });

    // Create Product Condition
    const condition = this.conditionRepo.create({
      external_id: condition_ext_id,
      product_ext_id,
      interior: parseFloat(dto.condition.interior),
      exterior: parseFloat(dto.condition.exterior),
      overall: parseFloat(dto.condition.overall),
      description: dto.condition.description,
      created_by: dto.created_by,
    });

    // Create Stock
    const stock = this.stockRepo.create({
      external_id: stock_ext_id,
      product_ext_id,
      is_consigned: dto.is_consigned,
      consigned_date: dto.consigned_date ? new Date(dto.consigned_date) : null,
      min_qty: dto.stock.min_qty,
      avail_qty: dto.stock.qty_in_stock,
      sold_qty: 0,
      created_by: dto.created_by,
    });

    await this.productRepo.save(product);
    await this.conditionRepo.save(condition);
    await this.stockRepo.save(stock);

    //Stock movement
    await this.stockMovementService.logStockMovement({
      stockExtId: stock_ext_id,
      type: 'INBOUND',
      source: 'NEW PRODUCT ADDED',
      qty_before: 0,
      qty_change: dto.stock.qty_in_stock,
      qty_after: dto.stock.qty_in_stock,
      createdBy: dto.created_by,
    });

    return {
      status: {
        success: true,
        message: 'Product successfully created',
      },
      data: this.buildProductResponse(
        stock_ext_id,
        product,
        condition,
        stock,
        miscVals,
      ),
    };
  }

  async updateStockFromSale(
    ext_id: string,
    dto: UpdateStockFromSaleDto,
  ): Promise<void> {
    const stock_ext_id = ext_id.trim();
    const { type, qty, updated_by } = dto;

    if (qty <= 0) {
      throw new BadRequestException({
        status: { success: false, message: 'Quantity must be greater than 0' },
      });
    }

    const stock = await this.stockRepo.findOne({
      where: { external_id: stock_ext_id },
    });

    if (!stock) {
      throw new NotFoundException({
        status: { success: false, message: 'Stock not found' },
      });
    }

    const qty_before = stock.avail_qty;
    const saleType = type.toUpperCase();
    const isSold = saleType === 'SALE' || saleType === 'LAYAWAY';

    if (isSold) {
      if (stock.avail_qty < qty) {
        throw new BadRequestException({
          status: {
            success: false,
            message: 'Not enough available quantity to sell',
          },
        });
      }
      stock.avail_qty -= qty;
      stock.sold_qty = (stock.sold_qty || 0) + qty; // <--- update sold_qty here
    } else {
      stock.avail_qty += qty;
      stock.sold_qty = Math.max((stock.sold_qty || 0) - qty, 0); // <--- optionally decrease sold_qty if it's a return
    }

    stock.updated_by = updated_by;
    stock.updated_at = new Date();
    await this.stockRepo.save(stock);

    const source = isSold ? saleType : 'CANCEL';
    const movementType = isSold ? 'OUTBOUND' : 'INBOUND';

    await this.stockMovementService.logStockMovement({
      stockExtId: stock_ext_id,
      type: movementType,
      source,
      qty_before,
      qty_change: qty,
      qty_after: stock.avail_qty,
      createdBy: updated_by,
    });
  }

  async updateProductStock(
    ext_id: string,
    dto: UpdateProductStockDto,
  ): Promise<IProductResponse> {
    const { type, qty, updated_by, cost } = dto;
    const stock_ext_id = ext_id.trim();

    const stock = await this.stockRepo.findOne({
      where: { external_id: stock_ext_id.trim() },
    });

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }
    const qty_before = stock.avail_qty;

    const product = await this.productRepo.findOne({
      where: { external_id: stock.product_ext_id.trim() },
    });

    if (!product) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Product not found',
        },
      });
    }

    if (qty <= 0) {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Quantity must be greater than 0',
        },
      });
    }
    const isIncrease = type.toLowerCase() === 'increase';

    if (isIncrease) {
      stock.avail_qty += qty;
      product.cost = cost;
    } else if (type.toLowerCase() === 'decrease') {
      if (stock.avail_qty < qty) {
        throw new BadRequestException({
          status: {
            success: false,
            message: 'Not enough available quantity to decrease',
          },
        });
      }
      stock.avail_qty -= qty;
    }

    stock.updated_by = updated_by;
    stock.updated_at = new Date();

    product.updated_by = updated_by;
    product.updated_at = new Date();

    await this.stockRepo.save(stock);
    await this.productRepo.save(product);

    // Stock movement logging
    await this.stockMovementService.logStockMovement({
      stockExtId: stock_ext_id,
      type: isIncrease ? 'INBOUND' : 'OUTBOUND',
      source: 'STOCK ADJUSTMENT',
      qty_before,
      qty_change: qty,
      qty_after: stock.avail_qty,
      createdBy: updated_by,
    });

    const response = await this.findOne(ext_id);

    return {
      ...response,
      status: {
        success: true,
        message: 'Stock updated successfully',
      },
    };

    // return {
    //   status: {
    //     success: true,
    //     message: 'Stock updated successfully',
    //   },
    // };
  }

  async update(
    ext_id: string,
    dto: UpdateProductDto,
  ): Promise<IProductResponse> {
    if (!dto.updated_by)
      throw new BadRequestException({
        status: { success: false, message: 'Updated By is required' },
      });

    if (!dto.is_consigned) {
      dto.consignor_ext_id = null;
      dto.consignor_selling_price = null;
      dto.consigned_date = null;
    } else {
      const throwIfMissing = (
        field: string | number,
        message: string,
      ): void => {
        if (!field) {
          throw new BadRequestException({
            status: { success: false, message },
          });
        }
      };

      throwIfMissing(
        dto.consignor_ext_id,
        'Consignor external ID is required if product is consigned.',
      );
      throwIfMissing(
        dto.consignor_selling_price,
        'Consignor selling price is required if product is consigned.',
      );
      throwIfMissing(
        dto.consigned_date,
        'Consigned date is required if product is consigned.',
      );
    }

    const stock = await this.stockRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }
    const product = await this.productRepo.findOne({
      where: { external_id: stock.product_ext_id.trim() },
    });

    if (!product) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Product not found',
        },
      });
    }

    const miscVals = await this.validateMisc(
      dto.category_ext_id,
      dto.brand_ext_id,
      dto.auth_ext_id,
      dto.consignor_ext_id,
    );
    await this.checkDuplicateProduct(
      dto.name,
      dto.category_ext_id,
      dto.brand_ext_id,
      product.external_id,
    );

    Object.assign(product, dto);
    product.updated_at = new Date();
    product.updated_by = dto.updated_by;
    await this.productRepo.save(product);

    let productCondition: ProductCondition;
    if (dto.condition) {
      productCondition = await this.conditionRepo.findOne({
        where: { product_ext_id: stock.product_ext_id.trim() },
      });

      if (!productCondition) {
        const {
          interior = null,
          exterior = null,
          overall = null,
          description = null,
        } = dto.condition || {};

        productCondition = this.conditionRepo.create({
          external_id: generateUniqueId(10),
          product_ext_id: product.external_id,
          interior: parseFloat(interior),
          exterior: parseFloat(exterior),
          overall: parseFloat(overall),
          description: description,
          created_by: dto.updated_by,
        });

        await this.conditionRepo.save(productCondition);
      } else {
        Object.assign(productCondition, dto.condition);
        productCondition.updated_at = new Date();
        productCondition.updated_by = dto.updated_by;
        await this.conditionRepo.save(productCondition);
      }
    }

    if (dto.is_consigned) {
      stock.is_consigned = dto.is_consigned;
      stock.consigned_date = dto.consigned_date
        ? new Date(dto.consigned_date)
        : null;
      stock.updated_at = new Date();
      stock.updated_by = dto.updated_by;

      await this.stockRepo.save(stock);
    }

    return {
      status: {
        success: true,
        message: 'Product successfully updated',
      },
      data: this.buildProductResponse(
        stock.external_id,
        product,
        productCondition,
        stock,
        miscVals,
      ),
    };
  }

  async remove(ext_id: string, deleted_by: string): Promise<IProductResponse> {
    if (!deleted_by)
      throw new BadRequestException({
        status: { success: false, message: 'Deleted By is required' },
      });

    const stock = await this.stockRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }
    const product = await this.productRepo.findOne({
      where: { external_id: stock.product_ext_id.trim() },
    });

    if (!product) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Product not found',
        },
      });
    }

    const hasSales = await this.sharedService.checkTransactionByClientOrStock(
      stock.external_id,
    );
    if (hasSales) {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Cannot delete: existing transactions found.',
        },
      });
    }

    const response = await this.findOne(ext_id);

    stock.deleted_by = deleted_by;
    product.deleted_by = deleted_by;

    await this.stockRepo.save(stock);
    await this.stockRepo.softDelete(stock.id);

    await this.productRepo.save(product);
    await this.productRepo.softDelete(product.id);

    const productCondition = await this.conditionRepo.findOne({
      where: { product_ext_id: stock.product_ext_id.trim() },
    });

    if (productCondition) {
      productCondition.deleted_by = deleted_by;

      await this.conditionRepo.save(productCondition);
      await this.conditionRepo.softDelete(productCondition.id);
    }

    return {
      ...response,
      status: { success: true, message: 'Product successfully deleted.' },
    };

    return {
      status: { success: true, message: 'Product successfully deleted.' },
    };
  }

  async findAll(dto: FindProductsDto): Promise<IProductsResponse> {
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

    const [products, totalCount] = await query.getManyAndCount();

    const results: IProduct[] = await Promise.all(
      products.map(async (product) => {
        const [condition, stock, miscVals, performedBy] = await Promise.all([
          this.conditionRepo.findOne({
            where: { product_ext_id: product.external_id },
          }),
          this.stockRepo.findOne({
            where: { product_ext_id: product.external_id },
          }),
          this.validateMisc(
            product.category_ext_id,
            product.brand_ext_id,
            product.auth_ext_id,
            product.consignor_ext_id,
          ),
          this.userService.getPerformedBy(
            product.created_by,
            product.updated_by,
            product.deleted_by,
          ),
        ]);

        return this.buildProductResponse(
          stock?.external_id,
          {
            ...product,
            created_by:
              performedBy.data.create?.name || product.created_by || null,
            updated_by:
              performedBy.data.update?.name || product.updated_by || null,
            deleted_by:
              performedBy.data.delete?.name || product.deleted_by || null,
          },
          condition,
          stock,
          miscVals,
        );
      }),
    );

    return {
      status: {
        success: true,
        message: 'Products fetched successfully',
      },
      data: results,
      meta: {
        page: pageNumber,
        totalNumber: totalCount,
        totalPages: Math.ceil(totalCount / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }

  async findOne(external_id: string): Promise<IProductResponse> {
    const stock = await this.stockRepo.findOne({
      where: { external_id: external_id.trim() },
    });

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }

    const product = await this.productRepo.findOne({
      where: { external_id: stock.product_ext_id.trim() },
    });

    if (!product) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Product not found',
        },
      });
    }

    const [condition, miscVals, performedBy] = await Promise.all([
      this.conditionRepo.findOne({
        where: { product_ext_id: product.external_id },
      }),
      this.validateMisc(
        product.category_ext_id,
        product.brand_ext_id,
        product.auth_ext_id,
        product.consignor_ext_id,
      ),
      this.userService.getPerformedBy(
        product.created_by,
        product.updated_by,
        product.deleted_by,
      ),
    ]);

    const resolvedProduct = {
      ...product,
      created_by: performedBy.data.create?.name || product.created_by || null,
      updated_by: performedBy.data.update?.name || product.updated_by || null,
      deleted_by: performedBy.data.delete?.name || product.deleted_by || null,
    };

    return {
      status: {
        success: true,
        message: 'Product found',
      },
      data: this.buildProductResponse(
        stock.external_id,
        resolvedProduct,
        condition,
        stock,
        miscVals,
      ),
    };
  }

  async findConsignorItems(
    consignor_ext_id: string,
    dto: FindConsignorProductsDto,
  ): Promise<IProductsResponse> {
    const { searchValue, pageNumber, displayPerPage, sortBy, orderBy } = dto;

    await this.clientService.findOne(consignor_ext_id.trim(), true);

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
        consignorId: consignor_ext_id.trim(),
      });

    query
      .orderBy(`product.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * displayPerPage)
      .take(displayPerPage);

    const [products, totalCount] = await query.getManyAndCount();

    const results: IProduct[] = await Promise.all(
      products.map(async (product) => {
        const [condition, stock, miscVals, performedBy] = await Promise.all([
          this.conditionRepo.findOne({
            where: { product_ext_id: product.external_id },
          }),
          this.stockRepo.findOne({
            where: { product_ext_id: product.external_id },
          }),
          this.validateMisc(
            product.category_ext_id,
            product.brand_ext_id,
            product.auth_ext_id,
            product.consignor_ext_id,
          ),
          this.userService.getPerformedBy(
            product.created_by,
            product.updated_by,
            product.deleted_by,
          ),
        ]);

        return this.buildProductResponse(
          stock?.external_id,
          {
            ...product,
            created_by:
              performedBy.data.create?.name || product.created_by || null,
            updated_by:
              performedBy.data.update?.name || product.updated_by || null,
            deleted_by:
              performedBy.data.delete?.name || product.deleted_by || null,
          },
          condition,
          stock,
          miscVals,
        );
      }),
    );

    return {
      status: {
        success: true,
        message: 'Products fetched successfully',
      },
      data: results,
      meta: {
        page: pageNumber,
        totalNumber: totalCount,
        totalPages: Math.ceil(totalCount / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }

  private buildProductResponse(
    stock_ext_id: string,
    product: Product,
    condition: ProductCondition,
    stock: Stock,
    miscVals: IPMiscsResponse,
  ): IProductResponse['data'] | null {
    if (!miscVals) return null;

    return {
      stock_external_id: stock_ext_id.trim(),
      product_external_id: product.external_id,
      category: {
        code: product.category_ext_id,
        name: miscVals.category_data?.name ?? null,
      },
      brand: {
        code: product.brand_ext_id,
        name: miscVals.brand_data?.name ?? null,
      },
      name: product.name,
      material: product.material,
      hardware: product.hardware,
      code: product.code,
      measurement: product.measurement,
      model: product.model,
      authenticator: product.auth_ext_id
        ? {
            code: product.auth_ext_id,
            name: miscVals.authenticator_data?.name ?? null,
          }
        : null,
      inclusions: product.inclusion,
      images: product.images,
      condition: condition
        ? {
            interior: condition.interior,
            exterior: condition.exterior,
            overall: condition.overall,
            description: condition.description,
          }
        : null,
      cost: product.cost,
      price: product.price,
      stock: stock
        ? {
            min_qty: stock.min_qty,
            qty_in_stock: stock.avail_qty,
            sold_stock: stock.sold_qty,
          }
        : null,
      is_consigned: product.is_consigned,
      consignor: product.is_consigned
        ? {
            code: product.consignor_ext_id,
            first_name: miscVals.consignor_data?.first_name ?? null,
            last_name: miscVals.consignor_data?.last_name ?? null,
          }
        : null,
      consignor_selling_price: product.consignor_selling_price,
      consigned_date: stock?.consigned_date ?? null,
      created_at: product.created_at,
      created_by: product.created_by,
      updated_at: product.updated_at,
      updated_by: product.updated_by,
      deleted_at: product.deleted_at,
      deleted_by: product.deleted_by,
    };
  }

  async getProductCounts(isConsigned: boolean = false): Promise<IProductCount> {
    const today = moment().startOf('day').toDate();
    const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
    const lastWeek = moment().subtract(7, 'days').startOf('day').toDate();
    const lastMonth = moment().subtract(30, 'days').startOf('day').toDate();
    const lastYear = moment().subtract(365, 'days').startOf('day').toDate();

    const whereClause: FindOptionsWhere<Stock> = {
      deleted_at: null,
    };
    if (isConsigned) {
      whereClause.is_consigned = true;
    }

    const [
      totalCount,
      todayCount,
      yesterdayCount,
      lastWeekCount,
      lastMonthCount,
      lastYearCount,
    ] = await Promise.all([
      this.stockRepo.count({ where: { ...whereClause } }),
      this.stockRepo.count({
        where: {
          ...whereClause,
          created_at: MoreThanOrEqual(today),
        },
      }),
      this.stockRepo.count({
        where: {
          ...whereClause,
          created_at: Between(yesterday, today),
        },
      }),
      this.stockRepo.count({
        where: {
          ...whereClause,
          created_at: MoreThanOrEqual(lastWeek),
        },
      }),
      this.stockRepo.count({
        where: {
          ...whereClause,
          created_at: MoreThanOrEqual(lastMonth),
        },
      }),
      this.stockRepo.count({
        where: {
          ...whereClause,
          created_at: MoreThanOrEqual(lastYear),
        },
      }),
    ]);

    return {
      status: {
        success: true,
        message: 'Successfully fetched data',
      },
      data: {
        totalCount: totalCount.toString(),
        todayCount: todayCount.toString(),
        yesterdayCount: yesterdayCount.toString(),
        lastWeekCount: lastWeekCount.toString(),
        lastMonthCount: lastMonthCount.toString(),
        lastYearCount: lastYearCount.toString(),
      },
    };
  }
}
