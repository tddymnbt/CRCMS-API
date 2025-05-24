import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('sale_layaways')
export class SaleLayaways {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  sale_ext_id: string;

  @Column({ type: 'int' })
  no_of_months: number;

  @Column({ type: 'decimal' })
  amount_due: number;

  @Column({ type: 'timestamp', nullable: true })
  payment_date: Date;

  @Column({ type: 'timestamp' })
  current_due_date: Date;

  @Column({ type: 'timestamp' })
  orig_due_date: Date;

  @Column({ type: 'boolean', default: false })
  is_extended: boolean;

  @Column({ type: 'varchar', length: 20 })
  status: 'Paid' | 'Unpaid';

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deleted_by?: string;
}
