import { Users } from 'src/modules/users/entity/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
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

  //Relationships
  @ManyToOne(() => Users, (user) => user.authentications)
  @JoinColumn({ name: 'user_ext_id', referencedColumnName: 'external_id' })
  user: Users;
}
