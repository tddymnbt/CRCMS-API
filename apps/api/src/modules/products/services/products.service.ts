import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { ProductCondition } from '../entities/product-condition.entity';
import { Stock } from '../entities/stock.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { CategoriesService } from './categories.service';
import { BrandsService } from './brands.service';
import { AuthenticatorsService } from './authenticators.service';
import {
  IPMiscsResponse,
  IProductResponse,
} from '../interfaces/product.interface';
import { ClientsService } from 'src/modules/clients/clients.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly pCategoryService: CategoriesService,
    private readonly pBrandService: BrandsService,
    private readonly pAuthenticatorService: AuthenticatorsService,
    private readonly clientService: ClientsService,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(ProductCondition)
    private readonly conditionRepo: Repository<ProductCondition>,

    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,

    // @InjectRepository(StockMovement)
    // private readonly stockMovementRepo: Repository<StockMovement>,
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

    await this.productRepo.save(product);

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

    await this.conditionRepo.save(condition);

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

    await this.stockRepo.save(stock);

    return {
      status: {
        success: true,
        message: 'Product successfully created',
      },
      data: this.buildProductResponse(product, condition, stock, miscVals),
    };
  }

  async findOne(external_id: string): Promise<IProductResponse> {
    const product = await this.productRepo.findOne({
      where: { external_id },
    });

    if (!product) {
      throw new NotFoundException({
        status: { success: false, message: 'Product not found' },
      });
    }

    const [condition, stock, miscVals] = await Promise.all([
      this.conditionRepo.findOne({ where: { product_ext_id: external_id } }),
      this.stockRepo.findOne({ where: { product_ext_id: external_id } }),
      this.validateMisc(
        product.category_ext_id,
        product.brand_ext_id,
        product.auth_ext_id,
        product.consignor_ext_id,
      ),
    ]);

    return {
      status: {
        success: true,
        message: 'Product found',
      },
      data: this.buildProductResponse(product, condition, stock, miscVals),
    };
  }

  private buildProductResponse(
    product: Product,
    condition: ProductCondition,
    stock: Stock,
    miscVals: IPMiscsResponse,
  ): IProductResponse['data'] | null {
    if (!miscVals) return null;

    return {
      external_id: product.external_id,
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
}
