import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DesignReference } from './design-reference.entity';

@Entity('design_reference_assets')
export class DesignReferenceAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_design_ref_asset_reference_id')
  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId!: string;

  @ManyToOne(() => DesignReference, (ref) => ref.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reference_id' })
  reference!: DesignReference;

  @Column({ name: 'asset_type', type: 'varchar', length: 50, default: 'image' })
  assetType!: 'image' | 'thumbnail' | 'mask' | 'svg_overlay' | 'palette_swatch';

  @Column({ name: 'asset_url', type: 'text' })
  assetUrl!: string;

  @Column({ name: 'width', type: 'int', nullable: true })
  width!: number | null;

  @Column({ name: 'height', type: 'int', nullable: true })
  height!: number | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, default: 'image/png' })
  mimeType!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
