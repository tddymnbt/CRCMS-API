import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductCategory } from '../entities/product-category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import {
  IProductMiscResponse,
  IProductMiscsResponse,
} from '../interfaces/p-misc.interface';
import { CreateProductMiscDto } from '../dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from '../dtos/update-p-misc.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private miscRepo: Repository<ProductCategory>,
  ) {}

  async findAll(): Promise<IProductMiscsResponse> {
    const query = this.miscRepo
      .createQueryBuilder('p_category')
      .where('p_category.deleted_at IS NULL')
      .orderBy('p_category.created_at', 'ASC')
      .skip((1 - 1) * 1000)
      .take(1000);

    const [categories, total] = await query.getManyAndCount();
    const categoriesWithoutId = categories.map(({ id, ...rest }) => rest);

    return {
      status: {
        success: true,
        message: `List of product categories`,
      },
      data: categoriesWithoutId,
      meta: {
        page: 1,
        totalNumber: total,
        totalPages: Math.ceil(total / 1000),
        displayPage: 1000,
      },
    };
  }

  async findOne(ext_id: string): Promise<IProductMiscResponse> {
    const productCategory = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!productCategory) {
      throw new NotFoundException({
        status: { success: false, message: 'Product category not found' },
      });
    }
    const { id, ...categoryWithoutId } = productCategory;
    return {
      status: { success: true, message: 'Product category details ' },
      data: categoryWithoutId,
    };
  }

  async create(dto: CreateProductMiscDto): Promise<IProductMiscResponse> {
    await this.checkDuplicateName(dto.name.trim());

    const extId = generateUniqueId(10);

    const pCategory = this.miscRepo.create({
      ...dto,
      external_id: extId,
    });
    await this.miscRepo.save(pCategory);

    const { id, ...categoryWithoutId } = pCategory;
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

    const pCategory: ProductCategory = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pCategory) {
      throw new NotFoundException('Product category not found');
    }

    await this.checkDuplicateName(dto.name?.trim(), ext_id.trim());

    Object.assign(pCategory, dto);
    pCategory.updated_at = new Date();
    pCategory.updated_by = dto.updated_by;
    await this.miscRepo.save(pCategory);

    const { id, ...categoryWithoutId } = pCategory;

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

    const pCategory = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pCategory) {
      throw new NotFoundException('Product category not found');
    }

    pCategory.deleted_by = deleted_by;

    await this.miscRepo.save(pCategory);

    await this.miscRepo.softDelete(pCategory.id);

    return {
      status: {
        success: true,
        message: 'Product category successfully deleted.',
      },
    };
  }

  async checkDuplicateName(name: string, ext_id?: string): Promise<boolean> {
    const where: FindOptionsWhere<ProductCategory> = {
      name: ILike(name.trim()),
      ...(ext_id && { external_id: Not(ext_id.trim()) }),
    };

    const checkDuplicate = await this.miscRepo.findOne({ where });

    if (checkDuplicate) {
      throw new ConflictException({
        status: { success: false, message: 'Product category already exists' },
      });
    }

    return false;
  }
}
