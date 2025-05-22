import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  external_id: string;

  @Column({ type: 'varchar', length: 100 })
  stock_ext_id: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 100 })
  source: string;

  @Column({ type: 'int' })
  qty_before: number;

  @Column({ type: 'int' })
  qty_change: number;

  @Column({ type: 'int' })
  qty_after: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100 })
  created_by: string;
}
