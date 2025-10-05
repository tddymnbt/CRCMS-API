import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermissions } from './role-permissions.entity';

@Entity('modules')
export class Modules {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  // Relationships

  @OneToMany(() => RolePermissions, (permission) => permission.modules)
  modules: RolePermissions[];
}
