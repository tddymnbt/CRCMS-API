export const PRODUCT_BRANDS_REPOSITORY = Symbol('PRODUCT_BRANDS_REPOSITORY');
export const PRODUCT_CATEGORIES_REPOSITORY = Symbol(
  'PRODUCT_CATEGORIES_REPOSITORY',
);
export const PRODUCT_AUTHENTICATORS_REPOSITORY = Symbol(
  'PRODUCT_AUTHENTICATORS_REPOSITORY',
);

export interface ProductMisc {
  id: number;
  external_id: string;
  name: string;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
}

export interface ProductMiscRepositoryPort<
  T extends ProductMisc = ProductMisc,
> {
  findAll(): Promise<[T[], number]>;
  findByExtId(extId: string): Promise<T | null>;
  findDuplicateByName(name: string, excludeExtId?: string): Promise<T | null>;
  create(payload: Partial<T>): T;
  save(entity: T): Promise<T>;
  softDelete(id: number): Promise<void>;
}
