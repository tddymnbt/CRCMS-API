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
import { CreateProductMiscDto } from '../dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from '../dtos/update-p-misc.dto';
import { ProductAuthenticator } from '../entities/product-authenticator.entity';

@Injectable()
export class AuthenticatorsService {
  constructor(
    @InjectRepository(ProductAuthenticator)
    private miscRepo: Repository<ProductAuthenticator>,
  ) {}

  async findAll(): Promise<IProductMiscsResponse> {
    const query = this.miscRepo
      .createQueryBuilder('p_authenticator')
      .where('p_authenticator.deleted_at IS NULL')
      .orderBy('p_authenticator.created_at', 'ASC')
      .skip((1 - 1) * 1000)
      .take(1000);

    const [authenticators, total] = await query.getManyAndCount();
    const authenticatorsWithoutId = authenticators.map(
      ({ id, ...rest }) => rest,
    );

    return {
      status: {
        success: true,
        message: `List of product authenticators`,
      },
      data: authenticatorsWithoutId,
      meta: {
        page: 1,
        totalNumber: total,
        totalPages: Math.ceil(total / 1000),
        displayPage: 1000,
      },
    };
  }

  async findOne(ext_id: string): Promise<IProductMiscResponse> {
    const pAuthenticator = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pAuthenticator) {
      throw new NotFoundException({
        status: { success: false, message: 'Product authenticator not found' },
      });
    }
    const { id, ...authenticatorWithoutId } = pAuthenticator;
    return {
      status: { success: true, message: 'Product authenticator details ' },
      data: authenticatorWithoutId,
    };
  }

  async create(dto: CreateProductMiscDto): Promise<IProductMiscResponse> {
    await this.checkDuplicateName(dto.name.trim());

    const extId = generateUniqueId(10);

    const pAuthenticator = this.miscRepo.create({
      ...dto,
      external_id: extId,
    });
    await this.miscRepo.save(pAuthenticator);

    const { id, ...authenticatorWithoutId } = pAuthenticator;
    return {
      status: {
        success: true,
        message: 'Product authenticator successfully created',
      },
      data: authenticatorWithoutId,
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

    const pAuthenticator: ProductAuthenticator = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pAuthenticator) {
      throw new NotFoundException('Product authenticator not found');
    }

    await this.checkDuplicateName(dto.name?.trim(), ext_id.trim());

    Object.assign(pAuthenticator, dto);
    pAuthenticator.updated_at = new Date();
    pAuthenticator.updated_by = dto.updated_by;
    await this.miscRepo.save(pAuthenticator);

    const { id, ...authenticatorWithoutId } = pAuthenticator;

    return {
      status: {
        success: true,
        message: 'Product authenticator successfully updated',
      },
      data: authenticatorWithoutId,
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

    const pAuthenticator = await this.miscRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!pAuthenticator) {
      throw new NotFoundException('Product authenticator not found');
    }

    pAuthenticator.deleted_by = deleted_by;

    await this.miscRepo.save(pAuthenticator);

    await this.miscRepo.softDelete(pAuthenticator.id);

    return {
      status: {
        success: true,
        message: 'Product authenticator successfully deleted.',
      },
    };
  }

  async checkDuplicateName(name: string, ext_id?: string): Promise<boolean> {
    const where: FindOptionsWhere<ProductAuthenticator> = {
      name: ILike(name.trim()),
      ...(ext_id && { external_id: Not(ext_id.trim()) }),
    };

    const checkDuplicate = await this.miscRepo.findOne({ where });

    if (checkDuplicate) {
      throw new ConflictException({
        status: {
          success: false,
          message: 'Product authenticator already exists',
        },
      });
    }

    return false;
  }
}
