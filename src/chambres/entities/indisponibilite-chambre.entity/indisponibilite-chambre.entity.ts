import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ChambreEntity } from '../chambre.entity/chambre.entity.js';
import { UtilisateurPersonnelEntity } from '../../../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';

@Entity({ name: 'indisponibilites_chambres' })
@Check('ck_indisponibilites_chambres_dates', '"date_fin" > "date_debut"')
@Index('idx_indisponibilites_chambres_dates', [
  'chambre',
  'dateDebut',
  'dateFin',
])
export class IndisponibiliteChambreEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ChambreEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chambre_id' })
  chambre!: Relation<ChambreEntity>;

  @ManyToOne(() => UtilisateurPersonnelEntity, { nullable: false })
  @JoinColumn({ name: 'cree_par_id' })
  creePar!: Relation<UtilisateurPersonnelEntity>;

  @Column({ name: 'date_debut', type: 'date' })
  dateDebut!: string;

  @Column({ name: 'date_fin', type: 'date' })
  dateFin!: string;

  @Column({ length: 200 })
  motif!: string;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamptz' })
  creeLe!: Date;
}
