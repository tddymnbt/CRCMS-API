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

  @Column({ type: 'decimal' })
  amount_due: number;

  @Column({ type: 'timestamp' })
  payment_date: Date;

  @Column({ type: 'timestamp' })
  due_date: Date;

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
