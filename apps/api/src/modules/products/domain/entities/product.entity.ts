import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10000 })
  category_ext_id: string;

  @Column({ type: 'varchar', length: 10000 })
  brand_ext_id: string;

  @Column({ type: 'varchar', length: 10000 })
  external_id: string;

  @Column({ type: 'varchar', length: 10000 })
  name: string;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  material?: string;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  hardware?: string;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  measurement?: string;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  model?: string;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  auth_ext_id?: string;

  @Column({ type: 'varchar', array: true, nullable: true })
  inclusion?: string[];

  @Column({ type: 'varchar', array: true, nullable: true })
  images?: string[];

  @Column({ type: 'varchar', length: 10000 })
  condition_ext_id: string;

  @Column({ type: 'decimal' })
  cost: number;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'boolean', default: false })
  is_consigned: boolean;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  consignor_ext_id?: string;

  @Column({ type: 'decimal', nullable: true })
  consignor_selling_price?: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 10000 })
  created_by: string;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at?: Date;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  updated_by?: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 10000, nullable: true })
  deleted_by?: string;
}
