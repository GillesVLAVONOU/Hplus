import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ChambreEntity } from '../../../chambres/entities/chambre.entity/chambre.entity.js';
import { ReservationEntity } from '../reservation.entity/reservation.entity.js';

@Entity({ name: 'lignes_reservation' })
@Unique('uq_ligne_reservation_chambre', ['reservation', 'chambre'])
@Index('idx_lignes_reservation_chambre', ['chambre'])
export class LigneReservationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'prix_par_nuit', type: 'numeric', precision: 12, scale: 2 })
  prixParNuit!: string;

  @Column({ name: 'nombre_nuits', type: 'int' })
  nombreNuits!: number;

  @Column({ name: 'sous_total', type: 'numeric', precision: 12, scale: 2 })
  sousTotal!: string;

  @ManyToOne(() => ReservationEntity, (reservation) => reservation.lignes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Relation<ReservationEntity>;

  @ManyToOne(() => ChambreEntity, (chambre) => chambre.lignesReservation, {
    nullable: false,
  })
  @JoinColumn({ name: 'chambre_id' })
  chambre!: Relation<ChambreEntity>;
}
