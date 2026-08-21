import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import {
  IProductMiscResponse,
  IProductMiscsResponse,
} from '../interfaces/p-misc.interface';
import { CreateProductMiscDto } from '../dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from '../dtos/update-p-misc.dto';
import {
  PRODUCT_BRANDS_REPOSITORY,
  ProductMiscRepositoryPort,
} from '../../domain/repositories/product-misc.repository.port';
import { ProductBrand } from '../../domain/entities/product-brand.entity';

@Injectable()
export class BrandsApplicationService {
  constructor(
    @Inject(PRODUCT_BRANDS_REPOSITORY)
    private miscRepository: ProductMiscRepositoryPort<ProductBrand>,
  ) {}

  async findAll(): Promise<IProductMiscsResponse> {
    const [brands, total] = await this.miscRepository.findAll();
    const brandsWithoutId = brands.map(({ id, ...rest }) => rest);

    return {
      status: {
        success: true,
        message: `List of product brands`,
      },
      data: brandsWithoutId,
      meta: {
        page: 1,
        totalNumber: total,
        totalPages: Math.ceil(total / 1000),
        displayPage: 1000,
      },
    };
  }

  async findOne(ext_id: string): Promise<IProductMiscResponse> {
    const productBrand = await this.miscRepository.findByExtId(ext_id);

    if (!productBrand) {
      throw new NotFoundException({
        status: { success: false, message: 'Product brand not found' },
      });
    }
    const { id, ...brandWithoutId } = productBrand;
    return {
      status: { success: true, message: 'Product brand details ' },
      data: brandWithoutId,
    };
  }

  async create(dto: CreateProductMiscDto): Promise<IProductMiscResponse> {
    await this.checkDuplicateName(dto.name.trim());

    const extId = generateUniqueId(10);

    const pBrand = this.miscRepository.create({
      ...dto,
      external_id: extId,
    });
    await this.miscRepository.save(pBrand);

    const { id, ...brandWithoutId } = pBrand;
    return {
      status: {
        success: true,
        message: 'Product brand successfully created',
      },
      data: brandWithoutId,
    };
  }

  async update(
    ext_id: string,
    dto: UpdateProductMiscDto,
  ): Promise<IProductMiscResponse> {
    if (!dto.updated_by)
      throw new BadRequestException({
        status: { success: false, message: 'Updated By is required' },
      });

    const pBrand = await this.miscRepository.findByExtId(ext_id);

    if (!pBrand) {
      throw new NotFoundException('Product brand not found');
    }

    await this.checkDuplicateName(dto.name?.trim(), ext_id.trim());

    Object.assign(pBrand, dto);
    pBrand.updated_at = new Date();
    pBrand.updated_by = dto.updated_by;
    await this.miscRepository.save(pBrand);

    const { id, ...brandWithoutId } = pBrand;

    return {
      status: {
        success: true,
        message: 'Product brand successfully updated',
      },
      data: brandWithoutId,
    };
  }

  async remove(
    ext_id: string,
    deleted_by: string,
  ): Promise<IProductMiscResponse> {
    if (!deleted_by)
      throw new BadRequestException({
        status: { success: false, message: 'Deleted By is required' },
      });

    const pBrand = await this.miscRepository.findByExtId(ext_id);

    if (!pBrand) {
      throw new NotFoundException('Product brand not found');
    }

    pBrand.deleted_by = deleted_by;

    await this.miscRepository.save(pBrand);

    await this.miscRepository.softDelete(pBrand.id);

    return {
      status: {
        success: true,
        message: 'Product brand successfully deleted.',
      },
    };
  }

  async checkDuplicateName(name: string, ext_id?: string): Promise<boolean> {
    const checkDuplicate = await this.miscRepository.findDuplicateByName(
      name,
      ext_id,
    );

    if (checkDuplicate) {
      throw new ConflictException({
        status: { success: false, message: 'Product brand already exists' },
      });
    }

    return false;
  }
}
