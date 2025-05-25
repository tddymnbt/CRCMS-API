import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('sales_items')
export class SalesItems {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  external_id: string;

  @Column({ type: 'varchar', length: 100 })
  sale_ext_id: string;

  @Column({ type: 'varchar', length: 100 })
  product_ext_id: string;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'decimal' })
  unit_price: number;

  @Column({ type: 'decimal' })
  subtotal: number;

  @Column({ type: 'varchar', array: true, nullable: true })
  images?: string[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updated_by?: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deleted_by?: string;
}
