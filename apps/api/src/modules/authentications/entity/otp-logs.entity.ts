import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_otp_logs')
export class UserOTPLogs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  otp: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_requested: Date;

  @Column({ type: 'timestamp', nullable: true })
  date_validated: Date;

  @Column({ default: false })
  is_used: boolean;

  @Column({ default: false })
  is_expired: boolean;
}
