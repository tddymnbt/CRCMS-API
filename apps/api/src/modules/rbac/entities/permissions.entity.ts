import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermissions } from './role-permissions.entity';

@Entity('permissions')
export class Permissions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  // Relationships
  @OneToMany(() => RolePermissions, (permission) => permission.permissions)
  permissions: RolePermissions[];
}
