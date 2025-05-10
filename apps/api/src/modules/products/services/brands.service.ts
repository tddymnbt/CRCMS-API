import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import {
  IProductMiscResponse,
  IProductMiscsResponse,
} from '../interfaces/p-misc.interface';
import { ProductBrand } from '../entities/product-brand.entity';
import { CreateProductMiscDto } from '../dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from '../dtos/update-p-misc.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(ProductBrand)
    private miscRepo: Repository<ProductBrand>,
  ) {}

  async findAll(): Promise<IProductMiscsResponse> {
    const query = this.miscRepo
      .createQueryBuilder('p_brand')
      .where('p_brand.deleted_at IS NULL')
      .orderBy('p_brand.created_at', 'ASC')
      .skip((1 - 1) * 1000)
      .take(1000);

    const [brands, total] = await query.getManyAndCount();
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
    const productBrand = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

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

    const pBrand = this.miscRepo.create({
      ...dto,
      external_id: extId,
    });
    await this.miscRepo.save(pBrand);

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

    const pBrand: ProductBrand = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pBrand) {
      throw new NotFoundException('Product brand not found');
    }

    await this.checkDuplicateName(dto.name?.trim(), ext_id.trim());

    Object.assign(pBrand, dto);
    pBrand.updated_at = new Date();
    pBrand.updated_by = dto.updated_by;
    await this.miscRepo.save(pBrand);

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

    const pBrand = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pBrand) {
      throw new NotFoundException('Product brand not found');
    }

    pBrand.deleted_by = deleted_by;

    await this.miscRepo.save(pBrand);

    await this.miscRepo.softDelete(pBrand.id);

    return {
      status: {
        success: true,
        message: 'Product brand successfully deleted.',
      },
    };
  }

  async checkDuplicateName(name: string, ext_id?: string): Promise<boolean> {
    const where: FindOptionsWhere<ProductBrand> = {
      name: ILike(name.trim()),
      ...(ext_id && { external_id: Not(ext_id.trim()) }),
    };

    const checkDuplicate = await this.miscRepo.findOne({ where });

    if (checkDuplicate) {
      throw new ConflictException({
        status: { success: false, message: 'Product brand already exists' },
      });
    }

    return false;
  }
}
