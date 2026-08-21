import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, ILike, Not, Repository } from 'typeorm';
import { ProductBrand } from '../../domain/entities/product-brand.entity';
import { ProductCategory } from '../../domain/entities/product-category.entity';
import { ProductAuthenticator } from '../../domain/entities/product-authenticator.entity';
import {
  PRODUCT_AUTHENTICATORS_REPOSITORY,
  PRODUCT_BRANDS_REPOSITORY,
  PRODUCT_CATEGORIES_REPOSITORY,
  ProductMisc,
  ProductMiscRepositoryPort,
} from '../../domain/repositories/product-misc.repository.port';

function createTypeormProductMiscRepository<T extends ProductMisc>(
  entity: new () => T,
): new (...args: never[]) => ProductMiscRepositoryPort<T> {
  @Injectable()
  class TypeormProductMiscRepository implements ProductMiscRepositoryPort<T> {
    constructor(
      @InjectRepository(entity)
      private readonly miscRepo: Repository<T>,
    ) {}

    async findAll(): Promise<[T[], number]> {
      const query = this.miscRepo
        .createQueryBuilder('misc')
        .where('misc.deleted_at IS NULL')
        .orderBy('misc.created_at', 'ASC')
        .skip(0)
        .take(1000);

      return query.getManyAndCount();
    }

    findByExtId(extId: string): Promise<T | null> {
      return this.miscRepo.findOne({
        where: { external_id: extId.trim() } as never,
      });
    }

    findDuplicateByName(
      name: string,
      excludeExtId?: string,
    ): Promise<T | null> {
      return this.miscRepo.findOne({
        where: {
          name: ILike(name.trim()),
          ...(excludeExtId && { external_id: Not(excludeExtId.trim()) }),
        } as never,
      });
    }

    create(payload: Partial<T>): T {
      return this.miscRepo.create(payload as DeepPartial<T>);
    }

    save(entity: T): Promise<T> {
      return this.miscRepo.save(entity);
    }

    async softDelete(id: number): Promise<void> {
      await (this.miscRepo as unknown as Repository<ProductBrand>).softDelete(
        id,
      );
    }
  }

  return TypeormProductMiscRepository;
}

export const TypeormBrandsRepository =
  createTypeormProductMiscRepository<ProductBrand>(ProductBrand);
export const TypeormCategoriesRepository =
  createTypeormProductMiscRepository<ProductCategory>(ProductCategory);
export const TypeormAuthenticatorsRepository =
  createTypeormProductMiscRepository<ProductAuthenticator>(
    ProductAuthenticator,
  );

export const BRANDS_REPOSITORY_PROVIDER = {
  provide: PRODUCT_BRANDS_REPOSITORY,
  useClass: TypeormBrandsRepository,
};

export const CATEGORIES_REPOSITORY_PROVIDER = {
  provide: PRODUCT_CATEGORIES_REPOSITORY,
  useClass: TypeormCategoriesRepository,
};

export const AUTHENTICATORS_REPOSITORY_PROVIDER = {
  provide: PRODUCT_AUTHENTICATORS_REPOSITORY,
  useClass: TypeormAuthenticatorsRepository,
};
