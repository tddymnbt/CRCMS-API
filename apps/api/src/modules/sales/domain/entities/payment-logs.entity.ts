import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('payment_logs')
export class PaymentLogs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  external_id: string;

  @Column({ type: 'varchar', length: 100 })
  sale_ext_id: string;

  @Column({ type: 'decimal' })
  amount: number;

  @Column({ type: 'timestamp' })
  payment_date: Date;

  @Column({ type: 'varchar', length: 100 })
  payment_method: string; // e.g., Cash, Card, etc.

  @Column({ type: 'boolean' })
  is_deposit: boolean;

  @Column({ type: 'boolean' })
  is_final_payment: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deleted_by?: string;
}
