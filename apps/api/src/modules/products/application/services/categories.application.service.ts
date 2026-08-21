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
  PRODUCT_CATEGORIES_REPOSITORY,
  ProductMiscRepositoryPort,
} from '../../domain/repositories/product-misc.repository.port';
import { ProductCategory } from '../../domain/entities/product-category.entity';

@Injectable()
export class CategoriesApplicationService {
  constructor(
    @Inject(PRODUCT_CATEGORIES_REPOSITORY)
    private miscRepository: ProductMiscRepositoryPort<ProductCategory>,
  ) {}

  async findAll(): Promise<IProductMiscsResponse> {
    const [categorys, total] = await this.miscRepository.findAll();
    const categorysWithoutId = categorys.map(({ id, ...rest }) => rest);

    return {
      status: {
        success: true,
        message: `List of product categories`,
      },
      data: categorysWithoutId,
      meta: {
        page: 1,
        totalNumber: total,
        totalPages: Math.ceil(total / 1000),
        displayPage: 1000,
      },
    };
  }

  async findOne(ext_id: string): Promise<IProductMiscResponse> {
    const ProductCategory = await this.miscRepository.findByExtId(ext_id);

    if (!ProductCategory) {
      throw new NotFoundException({
        status: { success: false, message: 'Product category not found' },
      });
    }
    const { id, ...categoryWithoutId } = ProductCategory;
    return {
      status: { success: true, message: 'Product category details ' },
      data: categoryWithoutId,
    };
  }

  async create(dto: CreateProductMiscDto): Promise<IProductMiscResponse> {
    await this.checkDuplicateName(dto.name.trim());

    const extId = generateUniqueId(10);

    const pcategory = this.miscRepository.create({
      ...dto,
      external_id: extId,
    });
    await this.miscRepository.save(pcategory);

    const { id, ...categoryWithoutId } = pcategory;
    return {
      status: {
        success: true,
        message: 'Product category successfully created',
      },
      data: categoryWithoutId,
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

    const pcategory = await this.miscRepository.findByExtId(ext_id);

    if (!pcategory) {
      throw new NotFoundException('Product category not found');
    }

    await this.checkDuplicateName(dto.name?.trim(), ext_id.trim());

    Object.assign(pcategory, dto);
    pcategory.updated_at = new Date();
    pcategory.updated_by = dto.updated_by;
    await this.miscRepository.save(pcategory);

    const { id, ...categoryWithoutId } = pcategory;

    return {
      status: {
        success: true,
        message: 'Product category successfully updated',
      },
      data: categoryWithoutId,
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

    const pcategory = await this.miscRepository.findByExtId(ext_id);

    if (!pcategory) {
      throw new NotFoundException('Product category not found');
    }

    pcategory.deleted_by = deleted_by;

    await this.miscRepository.save(pcategory);

    await this.miscRepository.softDelete(pcategory.id);

    return {
      status: {
        success: true,
        message: 'Product category successfully deleted.',
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
        status: { success: false, message: 'Product category already exists' },
      });
    }

    return false;
  }
}
