import { Users } from 'src/modules/users/entity/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Roles } from './roles.entity';

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

  //Relationships
  @ManyToOne(() => Users, (user) => user.activities)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'external_id' })
  user: Users;

  @OneToOne(() => Roles, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  roles: Roles;
}
