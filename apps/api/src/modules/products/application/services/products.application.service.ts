import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductCondition } from '../../domain/entities/product-condition.entity';
import { Stock } from '../../domain/entities/stock.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { CategoriesApplicationService } from './categories.application.service';
import { BrandsApplicationService } from './brands.application.service';
import { AuthenticatorsApplicationService } from './authenticators.application.service';
import {
  IPMiscsResponse,
  IProduct,
  IProductCount,
  IProductResponse,
  IProductsResponse,
} from '../interfaces/product.interface';
import { ClientsApplicationService } from 'src/modules/clients/application/services/clients.application.service';
import {
  FindConsignorProductsDto,
  FindProductsDto,
} from '../dtos/find-all-products.dto';
import { StockMovementApplicationService } from './stock-movement.application.service';
import {
  UpdateProductStockDto,
  UpdateStockFromSaleDto,
} from '../dtos/update-p-stock.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { UsersApplicationService } from 'src/modules/users/application/services/users.application.service';
import * as moment from 'moment';
import { SharedService } from 'src/common/shared/shared.service';
import {
  PRODUCTS_REPOSITORY,
  ProductsRepositoryPort,
} from '../../domain/repositories/products.repository.port';

@Injectable()
export class ProductsApplicationService {
  constructor(
    private readonly pCategoryService: CategoriesApplicationService,
    private readonly pBrandService: BrandsApplicationService,
    private readonly pAuthenticatorService: AuthenticatorsApplicationService,
    private readonly clientService: ClientsApplicationService,
    private readonly stockMovementService: StockMovementApplicationService,
    private readonly userService: UsersApplicationService,
    private readonly sharedService: SharedService,

    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: ProductsRepositoryPort,
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
    const checkDuplicate = await this.productsRepository.findDuplicateProduct(
      name,
      category,
      brand,
      ext_id,
    );

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
    const product = this.productsRepository.createProduct({
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
    const condition = this.productsRepository.createCondition({
      external_id: condition_ext_id,
      product_ext_id,
      interior: dto.condition.interior,
      exterior: dto.condition.exterior,
      overall: dto.condition.overall,
      description: dto.condition.description ?? null,
      created_by: dto.created_by,
    });

    // Create Stock
    const stock = this.productsRepository.createStock({
      external_id: stock_ext_id,
      product_ext_id,
      is_consigned: dto.is_consigned,
      consigned_date: dto.consigned_date ? new Date(dto.consigned_date) : null,
      min_qty: dto.stock.min_qty ?? 0,
      avail_qty: dto.stock.qty_in_stock,
      sold_qty: 0,
      created_by: dto.created_by,
    });

    await this.productsRepository.saveProduct(product);
    await this.productsRepository.saveCondition(condition);
    await this.productsRepository.saveStock(stock);

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

    const stock = await this.productsRepository.findStockByExtId(stock_ext_id);

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
    await this.productsRepository.saveStock(stock);

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

    const stock = await this.productsRepository.findStockByExtId(stock_ext_id);

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }
    const qty_before = stock.avail_qty;

    const product = await this.productsRepository.findProductByExtId(
      stock.product_ext_id,
    );

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
      product.cost = cost;
    }

    stock.updated_by = updated_by;
    stock.updated_at = new Date();

    product.updated_by = updated_by;
    product.updated_at = new Date();

    await this.productsRepository.saveStock(stock);
    await this.productsRepository.saveProduct(product);

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

    const stock = await this.productsRepository.findStockByExtId(ext_id);

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }
    const product = await this.productsRepository.findProductByExtId(
      stock.product_ext_id,
    );

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
    await this.productsRepository.saveProduct(product);

    let productCondition: ProductCondition;
    if (dto.condition) {
      productCondition =
        await this.productsRepository.findConditionByProductExtId(
          stock.product_ext_id,
        );

      if (!productCondition) {
        const {
          interior = null,
          exterior = null,
          overall = null,
          description = null,
        } = dto.condition || {};

        productCondition = this.productsRepository.createCondition({
          external_id: generateUniqueId(10),
          product_ext_id: product.external_id,
          interior: interior,
          exterior: exterior,
          overall: overall,
          description: description,
          created_by: dto.updated_by,
        });

        await this.productsRepository.saveCondition(productCondition);
      } else {
        Object.assign(productCondition, dto.condition);
        productCondition.updated_at = new Date();
        productCondition.updated_by = dto.updated_by;
        await this.productsRepository.saveCondition(productCondition);
      }
    }

    if (dto.is_consigned) {
      stock.is_consigned = dto.is_consigned;
      stock.consigned_date = dto.consigned_date
        ? new Date(dto.consigned_date)
        : null;
      stock.updated_at = new Date();
      stock.updated_by = dto.updated_by;

      await this.productsRepository.saveStock(stock);
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

    const stock = await this.productsRepository.findStockByExtId(ext_id);

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }
    const product = await this.productsRepository.findProductByExtId(
      stock.product_ext_id,
    );

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

    await this.productsRepository.saveStock(stock);
    await this.productsRepository.softDeleteStock(stock.id);

    await this.productsRepository.saveProduct(product);
    await this.productsRepository.softDeleteProduct(product.id);

    const productCondition =
      await this.productsRepository.findConditionByProductExtId(
        stock.product_ext_id,
      );

    if (productCondition) {
      productCondition.deleted_by = deleted_by;

      await this.productsRepository.saveCondition(productCondition);
      await this.productsRepository.softDeleteCondition(productCondition.id);
    }

    return {
      ...response,
      status: { success: true, message: 'Product successfully deleted.' },
    };
  }

  async findAll(dto: FindProductsDto): Promise<IProductsResponse> {
    const { pageNumber, displayPerPage } = dto;

    const [products, totalCount] =
      await this.productsRepository.findProducts(dto);

    const results: IProduct[] = await Promise.all(
      products.map(async (product) => {
        const [condition, stock, miscVals, performedBy] = await Promise.all([
          this.productsRepository.findConditionByProductExtId(
            product.external_id,
          ),
          this.productsRepository.findStockByProductExtId(product.external_id),
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
    const stock = await this.productsRepository.findStockByExtId(external_id);

    if (!stock) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Stock not found',
        },
      });
    }

    const product = await this.productsRepository.findProductByExtId(
      stock.product_ext_id,
    );

    if (!product) {
      throw new NotFoundException({
        status: {
          success: false,
          message: 'Product not found',
        },
      });
    }

    const [condition, miscVals, performedBy] = await Promise.all([
      this.productsRepository.findConditionByProductExtId(product.external_id),
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
    const { pageNumber, displayPerPage } = dto;

    await this.clientService.findOne(consignor_ext_id.trim(), true);

    const [products, totalCount] =
      await this.productsRepository.findConsignorProducts(
        consignor_ext_id,
        dto,
      );

    const results: IProduct[] = await Promise.all(
      products.map(async (product) => {
        const [condition, stock, miscVals, performedBy] = await Promise.all([
          this.productsRepository.findConditionByProductExtId(
            product.external_id,
          ),
          this.productsRepository.findStockByProductExtId(product.external_id),
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

    const [
      totalCount,
      todayCount,
      yesterdayCount,
      lastWeekCount,
      lastMonthCount,
      lastYearCount,
    ] = await Promise.all([
      this.productsRepository.countStocks({ isConsigned }),
      this.productsRepository.countStocks({ isConsigned, createdFrom: today }),
      this.productsRepository.countStocks({
        isConsigned,
        createdFrom: yesterday,
        createdTo: today,
      }),
      this.productsRepository.countStocks({
        isConsigned,
        createdFrom: lastWeek,
      }),
      this.productsRepository.countStocks({
        isConsigned,
        createdFrom: lastMonth,
      }),
      this.productsRepository.countStocks({
        isConsigned,
        createdFrom: lastYear,
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
