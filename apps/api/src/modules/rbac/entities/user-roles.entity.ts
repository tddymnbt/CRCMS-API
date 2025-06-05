import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_roles')
export class UserRoles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  user_id: string;

  @Column({ type: 'int' })
  role_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
