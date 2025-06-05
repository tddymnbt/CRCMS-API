import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  external_id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middle_name?: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  suffix?: string;

  @Column({ type: 'timestamptz' })
  birth_date: Date;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact_no?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  instagram?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  facebook?: string;

  @Column({ type: 'boolean', default: false })
  is_consignor: boolean;

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
