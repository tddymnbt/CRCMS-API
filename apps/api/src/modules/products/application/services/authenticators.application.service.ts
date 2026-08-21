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
  PRODUCT_AUTHENTICATORS_REPOSITORY,
  ProductMiscRepositoryPort,
} from '../../domain/repositories/product-misc.repository.port';
import { ProductAuthenticator } from '../../domain/entities/product-authenticator.entity';

@Injectable()
export class AuthenticatorsApplicationService {
  constructor(
    @Inject(PRODUCT_AUTHENTICATORS_REPOSITORY)
    private miscRepository: ProductMiscRepositoryPort<ProductAuthenticator>,
  ) {}

  async findAll(): Promise<IProductMiscsResponse> {
    const [authenticators, total] = await this.miscRepository.findAll();
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
    const ProductAuthenticator = await this.miscRepository.findByExtId(ext_id);

    if (!ProductAuthenticator) {
      throw new NotFoundException({
        status: { success: false, message: 'Product authenticator not found' },
      });
    }
    const { id, ...authenticatorWithoutId } = ProductAuthenticator;
    return {
      status: { success: true, message: 'Product authenticator details ' },
      data: authenticatorWithoutId,
    };
  }

  async create(dto: CreateProductMiscDto): Promise<IProductMiscResponse> {
    await this.checkDuplicateName(dto.name.trim());

    const extId = generateUniqueId(10);

    const pauthenticator = this.miscRepository.create({
      ...dto,
      external_id: extId,
    });
    await this.miscRepository.save(pauthenticator);

    const { id, ...authenticatorWithoutId } = pauthenticator;
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

    const pauthenticator = await this.miscRepository.findByExtId(ext_id);

    if (!pauthenticator) {
      throw new NotFoundException('Product authenticator not found');
    }

    await this.checkDuplicateName(dto.name?.trim(), ext_id.trim());

    Object.assign(pauthenticator, dto);
    pauthenticator.updated_at = new Date();
    pauthenticator.updated_by = dto.updated_by;
    await this.miscRepository.save(pauthenticator);

    const { id, ...authenticatorWithoutId } = pauthenticator;

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

    const pauthenticator = await this.miscRepository.findByExtId(ext_id);

    if (!pauthenticator) {
      throw new NotFoundException('Product authenticator not found');
    }

    pauthenticator.deleted_by = deleted_by;

    await this.miscRepository.save(pauthenticator);

    await this.miscRepository.softDelete(pauthenticator.id);

    return {
      status: {
        success: true,
        message: 'Product authenticator successfully deleted.',
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
        status: {
          success: false,
          message: 'Product authenticator already exists',
        },
      });
    }

    return false;
  }
}
