import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';

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

}
