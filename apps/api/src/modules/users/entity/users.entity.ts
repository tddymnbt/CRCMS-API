import { ActivityLog } from 'src/modules/activity_logs/entities/activity-log.entity';
import { UserOTPLogs } from 'src/modules/authentications/entity/otp-logs.entity';
import { UserAuthentications } from 'src/modules/authentications/entity/user-auth.entity';
import { UserRoles } from 'src/modules/rbac/entities/user-roles.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  external_id: string;

  @Column({ type: 'varchar' })
  first_name: string;

  @Column({ type: 'varchar' })
  last_name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar' })
  created_by: string;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  updated_by: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @Column({ type: 'varchar', nullable: true })
  deleted_by: string;

  @Column({ type: 'varchar', nullable: true })
  last_login: string;

  // Relationships
  @OneToMany(() => ActivityLog, (activities) => activities.user, {
    cascade: true,
  })
  activities: ActivityLog[];

  @OneToMany(() => UserOTPLogs, (otp) => otp.user, { cascade: true })
  otps: UserOTPLogs[];

  @OneToMany(
    () => UserAuthentications,
    (authentication) => authentication.user,
    { cascade: true },
  )
  authentications: UserAuthentications[];

  @OneToMany(() => UserRoles, (role) => role.user)
  roles: UserRoles[];
}
