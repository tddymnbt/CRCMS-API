import { Users } from 'src/modules/users/domain/entities/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_refresh_tokens')
export class UserRefreshTokens {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  user_ext_id: string;

  @Column({ type: 'varchar', unique: true })
  token_hash: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  rotated_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar' })
  created_by: string;

  //Relationships
  @ManyToOne(() => Users, (user) => user.refresh_tokens)
  @JoinColumn({ name: 'user_ext_id', referencedColumnName: 'external_id' })
  user: Users;
}
