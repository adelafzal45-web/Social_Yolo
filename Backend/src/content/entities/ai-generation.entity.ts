import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_generations')
export class AiGeneration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_ai_generations_workspace')
  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId!: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Index('idx_ai_generations_task')
  @Column({ name: 'task_type', type: 'varchar', length: 100 })
  taskType!: string;

  @Column({ name: 'provider', type: 'varchar', length: 100 })
  provider!: string;

  @Column({ name: 'model', type: 'varchar', length: 150 })
  model!: string;

  @Column({ name: 'input', type: 'jsonb', nullable: true })
  input!: Record<string, any> | null;

  @Column({ name: 'output', type: 'jsonb', nullable: true })
  output!: Record<string, any> | null;

  @Column({ name: 'prompt_version', type: 'varchar', length: 100, default: 'v1' })
  promptVersion!: string;

  @Column({ name: 'tokens_input', type: 'integer', default: 0 })
  tokensInput!: number;

  @Column({ name: 'tokens_output', type: 'integer', default: 0 })
  tokensOutput!: number;

  @Column({ name: 'latency_ms', type: 'integer', default: 0 })
  latencyMs!: number;

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 4, default: 0 })
  cost!: number;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'success' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
