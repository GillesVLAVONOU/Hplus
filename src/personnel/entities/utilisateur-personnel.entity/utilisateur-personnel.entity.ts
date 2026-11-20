import {
  Column,
  Check,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { RoleEnum } from '../../../authentification/enums/role.enum/role.enum.js';
import { ReservationEntity } from '../../../reservations/entities/reservation.entity/reservation.entity.js';

@Entity({ name: 'utilisateurs_personnel' })
@Check(
  'ck_personnel_role',
  `"role" IN ('RECEPTIONNISTE', 'ADMINISTRATEUR')`,
)
export class UtilisateurPersonnelEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  nom!: string;

  @Column({ length: 80 })
  prenom!: string;

  @Column({ unique: true, length: 160 })
  email!: string;

  @Column({ name: 'mot_de_passe_hache', select: false })
  motDePasseHache!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: RoleEnum;

  @Column({ default: true })
  actif!: boolean;

  @OneToMany(
    () => ReservationEntity,
    (reservation) => reservation.creePar,
  )
  reservationsCreees!: Relation<ReservationEntity[]>;
}
