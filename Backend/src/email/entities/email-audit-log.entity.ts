import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('email_audit_logs')
export class EmailAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_email_audit_logs_actor_id')
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail!: string | null;

  @Index('idx_email_audit_logs_action')
  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100 })
  entity!: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 255, nullable: true })
  entityId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
