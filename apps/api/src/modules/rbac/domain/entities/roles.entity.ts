import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRoles } from './user-roles.entity';
import { RolePermissions } from './role-permissions.entity';

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  // Relationships
  @OneToOne(() => UserRoles, (userRole) => userRole.roles)
  userRoles: UserRoles;

  @OneToMany(() => RolePermissions, (permission) => permission.roles)
  roles: RolePermissions[];
}
