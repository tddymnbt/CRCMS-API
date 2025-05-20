import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
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
  type: 'R' | 'L'; // R = regular, L = layaway

  @Column({ type: 'decimal' })
  total_amount: number;

  @Column({ type: 'timestamp' })
  date_purchased: Date;

  @Column({ type: 'varchar', length: 20 })
  status: 'Fully paid' | 'Not paid' | 'Deposit' | 'Cancelled';

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deleted_by?: string;
}
