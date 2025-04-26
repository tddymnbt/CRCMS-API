import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_authentications')
export class UserAuthentications {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  user_ext_id: string;

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'varchar' })
  token_jti: string;

  @Column({ type: 'varchar' })
  token_expiry: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar' })
  created_by: string;
}
