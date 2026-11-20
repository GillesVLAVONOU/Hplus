import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ClientEntity } from '../../../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../../../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { StatutReservationEnum } from '../../enums/statut-reservation.enum/statut-reservation.enum.js';
import { LigneReservationEntity } from '../ligne-reservation.entity/ligne-reservation.entity.js';

@Entity({ name: 'reservations' })
@Check(
  'ck_reservations_statut',
  `"statut" IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')`,
)
@Check('ck_reservations_dates', '"date_depart" > "date_arrivee"')
@Check('ck_reservations_personnes', '"nombre_personnes" > 0')
@Check('ck_reservations_montant', '"montant_total" >= 0')
@Index('idx_reservations_dates_statut', [
  'dateArrivee',
  'dateDepart',
  'statut',
])
@Index('idx_reservations_client', ['client'])
@Index('idx_reservations_personnel', ['creePar'])
export class ReservationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 30 })
  numero!: string;

  @Column({ name: 'date_arrivee', type: 'date' })
  dateArrivee!: string;

  @Column({ name: 'date_depart', type: 'date' })
  dateDepart!: string;

  @Column({ name: 'nombre_personnes', type: 'int' })
  nombrePersonnes!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: StatutReservationEnum.EN_ATTENTE,
  })
  statut!: StatutReservationEnum;

  @Column({ name: 'montant_total', type: 'numeric', precision: 12, scale: 2 })
  montantTotal!: string;

  @Column({ length: 3, default: 'XOF' })
  devise!: string;

  @Column({ name: 'expire_le', type: 'timestamptz', nullable: true })
  expireLe!: Date | null;

  @ManyToOne(() => ClientEntity, (client) => client.reservations, {
    nullable: false,
  })
  @JoinColumn({ name: 'client_id' })
  client!: Relation<ClientEntity>;

  @ManyToOne(
    () => UtilisateurPersonnelEntity,
    (utilisateur) => utilisateur.reservationsCreees,
    { nullable: true },
  )
  @JoinColumn({ name: 'cree_par_id' })
  creePar!: Relation<UtilisateurPersonnelEntity> | null;

  @OneToMany(() => LigneReservationEntity, (ligne) => ligne.reservation, {
    cascade: ['insert'],
  })
  lignes!: Relation<LigneReservationEntity[]>;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamptz' })
  creeLe!: Date;
}
