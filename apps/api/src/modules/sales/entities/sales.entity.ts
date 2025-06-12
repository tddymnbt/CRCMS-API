import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('sales')
export class Sales {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  external_id: string;

  @Column({ type: 'varchar', length: 100 })
  client_ext_id: string;

  @Column({ type: 'varchar', length: 1 })
  type: string; // R = regular, L = layaway

  @Column({ type: 'decimal', nullable: false })
  total_amount: number;

  @Column({ type: 'bool', default: true })
  is_discounted: boolean;

  @Column({ type: 'decimal', default: 0 })
  discount_percent: number;

  @Column({ type: 'decimal', default: 0 })
  discount_flat_rate: number;

  @Column({ type: 'timestamp' })
  date_purchased: Date;

  @Column({ type: 'varchar', length: 10000 })
  status: 'Fully paid' | 'Not paid' | 'Deposit' | 'Cancelled';

  @Column({ type: 'varchar', array: true, nullable: true })
  images?: string[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cancelled_by?: string;
}
