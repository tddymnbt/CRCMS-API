import { Users } from 'src/modules/users/entity/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  user_ext_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module?: string;

  @Column({ type: 'text', nullable: true })
  action?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ref_id?: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Users, (user) => user.activities)
  @JoinColumn({ name: 'user_ext_id', referencedColumnName: 'external_id' })
  user: Users;
}
