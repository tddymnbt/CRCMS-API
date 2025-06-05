import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
  } from 'typeorm';
  
  @Entity('product_categories')
  export class ProductCategory {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar', length: 100 })
    external_id: string;
  
    @Column({ type: 'varchar', length: 100 })
    name: string;
  
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