import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('client_bank_details')
export class ClientBankDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  client_ext_id: string;

  @Column({ type: 'varchar', length: 100 })
  account_name: string;

  @Column({ type: 'varchar', length: 100 })
  account_no: string;

  @Column({ type: 'varchar', length: 100 })
  bank: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;

  @UpdateDateColumn({ nullable: true })
  updated_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updated_by?: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deleted_by?: string;
}
