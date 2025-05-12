import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
  } from 'typeorm';
  
  @Entity('stocks')
  export class Stock {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar', length: 100 })
    external_id: string;
  
    @Column({ type: 'varchar', length: 100 })
    product_ext_id: string;
  
    @Column({ type: 'boolean', default: false })
    is_consigned: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    consigned_date: Date;
  
    @Column({ type: 'int', default: 0 })
    min_qty: number;
  
    @Column({ type: 'int', default: 0 })
    avail_qty: number;
  
    @Column({ type: 'int', default: 0 })
    sold_qty: number;
  
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