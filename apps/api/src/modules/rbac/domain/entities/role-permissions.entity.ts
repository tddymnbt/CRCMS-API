import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Roles } from './roles.entity';
import { Modules } from './modules.entity';
import { Permissions } from './permissions.entity';

@Entity('role_permissions')
export class RolePermissions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  role_id: number;

  @Column({ type: 'int' })
  module_id: number;

  @Column({ type: 'int' })
  permission_id: number;

  // Relationships
  @ManyToOne(() => Roles, (role) => role.roles)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  roles: Roles;

  @ManyToOne(() => Modules, (module) => module.modules)
  @JoinColumn({ name: 'module_id', referencedColumnName: 'id' })
  modules: Modules;

  @ManyToOne(() => Permissions, (permission) => permission.permissions)
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'id' })
  permissions: Permissions;
}
