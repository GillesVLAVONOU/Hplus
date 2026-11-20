import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UtilisateurPersonnelEntity } from '../../../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';

@Entity({ name: 'journaux_audit' })
@Index('idx_journaux_audit_entite', ['entite', 'entiteId'])
@Index('idx_journaux_audit_utilisateur', ['utilisateur'])
export class JournalAuditEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  action!: string;

  @Column({ length: 80 })
  entite!: string;

  @Column({ name: 'entite_id', type: 'int', nullable: true })
  entiteId!: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  details!: Record<string, unknown>;

  @ManyToOne(() => UtilisateurPersonnelEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur!: Relation<UtilisateurPersonnelEntity> | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamptz' })
  creeLe!: Date;
}
