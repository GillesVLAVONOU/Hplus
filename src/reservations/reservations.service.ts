import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Brackets, DataSource, EntityManager, In } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { ChambreEntity } from '../chambres/entities/chambre.entity/chambre.entity.js';
import { IndisponibiliteChambreEntity } from '../chambres/entities/indisponibilite-chambre.entity/indisponibilite-chambre.entity.js';
import { StatutChambreEnum } from '../chambres/enums/statut-chambre.enum/statut-chambre.enum.js';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { CreerReservationDto } from './dto/creer-reservation.dto/creer-reservation.dto.js';
import { CreerIndisponibiliteDto } from './dto/creer-indisponibilite.dto/creer-indisponibilite.dto.js';
import { ModifierReservationDto } from './dto/modifier-reservation.dto/modifier-reservation.dto.js';
import { PlanningPeriodeDto } from './dto/planning-periode.dto/planning-periode.dto.js';
import { LigneReservationEntity } from './entities/ligne-reservation.entity/ligne-reservation.entity.js';
import { ReservationEntity } from './entities/reservation.entity/reservation.entity.js';
import { StatutReservationEnum } from './enums/statut-reservation.enum/statut-reservation.enum.js';
import {
  centimes,
  dateLocaleHotel,
  DUREE_BLOCAGE_MINUTES,
  formaterMontant,
  validerPeriode,
} from './utils/reservation.util.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectDataSource()
    private readonly source: DataSource,
    private readonly audit: AuditService,
  ) {}

  async rechercherDisponibilites(
    dateArrivee: string,
    dateDepart: string,
    personnes?: number,
  ) {
    validerPeriode(dateArrivee, dateDepart);
    const chambres = await this.source
      .getRepository(ChambreEntity)
      .createQueryBuilder('chambre')
      .innerJoinAndSelect('chambre.typeChambre', 'type')
      .where('chambre.statut = :statut', {
        statut: StatutChambreEnum.DISPONIBLE,
      })
      .andWhere('type.actif = true')
      .orderBy('type.nom', 'ASC')
      .addOrderBy('chambre.numero', 'ASC')
      .getMany();

    if (!chambres.length) {
      return { chambres: [], capaciteDisponible: 0, peutAccueillir: false };
    }

    const indisponibles = await this.chambresIndisponibles(
      this.source.manager,
      chambres.map((chambre) => chambre.id),
      dateArrivee,
      dateDepart,
    );
    const disponibles = chambres.filter(
      (chambre) => !indisponibles.has(chambre.id),
    );
    const capaciteDisponible = disponibles.reduce(
      (total, chambre) => total + chambre.typeChambre.capacite,
      0,
    );
    return {
      chambres: disponibles,
      capaciteDisponible,
      peutAccueillir:
        personnes === undefined || capaciteDisponible >= personnes,
    };
  }

  async rechercherPlanning({ debut, fin }: PlanningPeriodeDto) {
    this.verifierPeriodePlanning(debut, fin);
    const reservationRepository = this.source.getRepository(ReservationEntity);
    const reservations = await reservationRepository
      .createQueryBuilder('reservation')
      .leftJoin('reservation.client', 'client')
      .addSelect(['client.id', 'client.nom', 'client.prenom'])
      .leftJoinAndSelect('reservation.lignes', 'ligne')
      .leftJoinAndSelect('ligne.chambre', 'chambre')
      .leftJoinAndSelect('chambre.typeChambre', 'typeChambre')
      .where('reservation.dateArrivee < :fin', { fin })
      .andWhere('reservation.dateDepart > :debut', { debut })
      .andWhere('reservation.statut != :annulee', {
        annulee: StatutReservationEnum.ANNULEE,
      })
      .andWhere(
        new Brackets((query) => {
          query
            .where('reservation.statut != :attente', {
              attente: StatutReservationEnum.EN_ATTENTE,
            })
            .orWhere('reservation.expireLe > :instant', {
              instant: new Date(),
            });
        }),
      )
      .orderBy('reservation.dateArrivee', 'ASC')
      .getMany();
    const indisponibilites = await this.source
      .getRepository(IndisponibiliteChambreEntity)
      .createQueryBuilder('indisponibilite')
      .leftJoinAndSelect('indisponibilite.chambre', 'chambre')
      .leftJoinAndSelect('chambre.typeChambre', 'typeChambre')
      .where('indisponibilite.dateDebut < :fin', { fin })
      .andWhere('indisponibilite.dateFin > :debut', { debut })
      .orderBy('indisponibilite.dateDebut', 'ASC')
      .getMany();
    const chambres = await this.source.getRepository(ChambreEntity).find({
      relations: { typeChambre: true },
      order: { numero: 'ASC' },
    });

    return { reservations, indisponibilites, chambres };
  }

  async creerIndisponibilite(
    dto: CreerIndisponibiliteDto,
    utilisateur: UtilisateurAuthentifie,
  ) {
    validerPeriode(dto.dateDebut, dto.dateFin);
    const motif = dto.motif.trim();
    if (!motif) throw new BadRequestException('Le motif est obligatoire.');

    return this.source.transaction(async (gestionnaire) => {
      await gestionnaire
        .createQueryBuilder(ChambreEntity, 'chambre')
        .setLock('pessimistic_write')
        .where('chambre.id = :id', { id: dto.chambreId })
        .getOne();
      const chambre = await gestionnaire
        .getRepository(ChambreEntity)
        .findOneBy({ id: dto.chambreId });
      if (!chambre) throw new NotFoundException('Chambre introuvable.');

      const indisponibles = await this.chambresIndisponibles(
        gestionnaire,
        [chambre.id],
        dto.dateDebut,
        dto.dateFin,
      );
      if (indisponibles.has(chambre.id)) {
        throw new ConflictException(
          `La chambre ${chambre.numero} a déjà une réservation ou une indisponibilité sur cette période.`,
        );
      }

      const repository = gestionnaire.getRepository(
        IndisponibiliteChambreEntity,
      );
      const indisponibilite = await repository.save(
        repository.create({
          chambre,
          creePar: { id: utilisateur.id },
          dateDebut: dto.dateDebut,
          dateFin: dto.dateFin,
          motif,
        }),
      );
      await this.audit.enregistrer(
        {
          action: 'CREATION_INDISPONIBILITE_CHAMBRE',
          entite: 'IndisponibiliteChambre',
          entiteId: indisponibilite.id,
          details: {
            chambreId: chambre.id,
            dateDebut: dto.dateDebut,
            dateFin: dto.dateFin,
            motif,
          },
          utilisateurId: utilisateur.id,
        },
        gestionnaire,
      );
      return repository.findOneOrFail({
        where: { id: indisponibilite.id },
        relations: { chambre: { typeChambre: true } },
      });
    });
  }

  async supprimerIndisponibilite(
    id: number,
    utilisateur: UtilisateurAuthentifie,
  ) {
    return this.source.transaction(async (gestionnaire) => {
      const repository = gestionnaire.getRepository(
        IndisponibiliteChambreEntity,
      );
      const indisponibilite = await repository.findOne({
        where: { id },
        relations: { chambre: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!indisponibilite) {
        throw new NotFoundException('Indisponibilité introuvable.');
      }
      await repository.remove(indisponibilite);
      await this.audit.enregistrer(
        {
          action: 'SUPPRESSION_INDISPONIBILITE_CHAMBRE',
          entite: 'IndisponibiliteChambre',
          entiteId: id,
          details: { chambreId: indisponibilite.chambre.id },
          utilisateurId: utilisateur.id,
        },
        gestionnaire,
      );
      return { id };
    });
  }

  async creerPourClient(
    clientId: number,
    dto: CreerReservationDto,
    auteurPersonnel?: number,
  ) {
    const nombreNuits = validerPeriode(dto.dateArrivee, dto.dateDepart);
    return this.source.transaction(async (gestionnaire) => {
      const client = await gestionnaire.getRepository(ClientEntity).findOneBy({
        id: clientId,
        actif: true,
      });
      if (!client) throw new NotFoundException('Client actif introuvable.');

      const personnel = auteurPersonnel
        ? await gestionnaire
            .getRepository(UtilisateurPersonnelEntity)
            .findOneBy({ id: auteurPersonnel, actif: true })
        : null;
      if (auteurPersonnel && !personnel) {
        throw new NotFoundException('Membre du personnel introuvable.');
      }

      const lignes = await this.preparerLignes(
        gestionnaire,
        dto.chambresIds,
        dto.dateArrivee,
        dto.dateDepart,
        dto.nombrePersonnes,
      );
      const montantTotal = lignes.reduce(
        (total, ligne) =>
          total + centimes(ligne.prixParNuit) * BigInt(nombreNuits),
        0n,
      );
      const reservationRepository =
        gestionnaire.getRepository(ReservationEntity);
      const reservation = reservationRepository.create({
        numero: this.genererNumero(),
        dateArrivee: dto.dateArrivee,
        dateDepart: dto.dateDepart,
        nombrePersonnes: dto.nombrePersonnes,
        statut: StatutReservationEnum.EN_ATTENTE,
        montantTotal: formaterMontant(montantTotal),
        devise: 'XOF',
        expireLe: new Date(Date.now() + DUREE_BLOCAGE_MINUTES * 60_000),
        client,
        creePar: personnel,
        lignes: lignes.map((ligne) =>
          gestionnaire.getRepository(LigneReservationEntity).create({
            prixParNuit: ligne.prixParNuit,
            nombreNuits,
            sousTotal: formaterMontant(
              centimes(ligne.prixParNuit) * BigInt(nombreNuits),
            ),
            chambre: ligne.chambre,
          }),
        ),
      });
      const enregistree = await reservationRepository.save(reservation);
      await this.audit.enregistrer(
        {
          action: 'CREATION_RESERVATION',
          entite: 'Reservation',
          entiteId: enregistree.id,
          details: {
            numero: enregistree.numero,
            nombreChambres: lignes.length,
            montantTotal: enregistree.montantTotal,
            devise: enregistree.devise,
          },
          utilisateurId: auteurPersonnel ?? null,
        },
        gestionnaire,
      );
      return reservationRepository.findOneOrFail({
        where: { id: enregistree.id },
        relations: {
          client: true,
          creePar: true,
          lignes: { chambre: { typeChambre: true } },
        },
      });
    });
  }

  async listerMesReservations(clientId: number) {
    return this.source.getRepository(ReservationEntity).find({
      where: { client: { id: clientId } },
      relations: { lignes: { chambre: { typeChambre: true } } },
      order: { creeLe: 'DESC' },
    });
  }

  async listerPourPersonnel(page: number, limite: number) {
    const [reservations, total] = await this.source
      .getRepository(ReservationEntity)
      .findAndCount({
        relations: {
          client: true,
          creePar: true,
          lignes: { chambre: { typeChambre: true } },
        },
        order: { creeLe: 'DESC' },
        skip: (page - 1) * limite,
        take: limite,
      });
    return { reservations, total, page, limite };
  }

  async annulerParClient(id: number, utilisateur: UtilisateurAuthentifie) {
    if (utilisateur.typeCompte !== 'CLIENT') {
      throw new ForbiddenException('Cette opération est réservée aux clients.');
    }
    return this.source.transaction(async (gestionnaire) => {
      const repository = gestionnaire.getRepository(ReservationEntity);
      const reservation = await repository.findOne({
        where: { id, client: { id: utilisateur.id } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Réservation introuvable.');
      if (
        ![
          StatutReservationEnum.EN_ATTENTE,
          StatutReservationEnum.CONFIRMEE,
        ].includes(reservation.statut)
      ) {
        throw new ConflictException(
          'Cette réservation ne peut plus être annulée par le client.',
        );
      }
      if (dateLocaleHotel(new Date()) >= reservation.dateArrivee) {
        throw new ConflictException(
          'L’annulation par le client est possible uniquement avant la date d’arrivée.',
        );
      }
      reservation.statut = StatutReservationEnum.ANNULEE;
      reservation.expireLe = null;
      await repository.save(reservation);
      await this.audit.enregistrer(
        {
          action: 'ANNULATION_RESERVATION_CLIENT',
          entite: 'Reservation',
          entiteId: id,
          details: {
            numero: reservation.numero,
            typeCompte: utilisateur.typeCompte,
            utilisateurId: utilisateur.id,
          },
        },
        gestionnaire,
      );
      return { id, numero: reservation.numero, statut: reservation.statut };
    });
  }

  async modifier(
    id: number,
    dto: ModifierReservationDto,
    utilisateur: UtilisateurAuthentifie,
  ) {
    return this.source.transaction(async (gestionnaire) => {
      const repository = gestionnaire.getRepository(ReservationEntity);
      const reservation = await repository.findOne({
        where: { id },
        relations: { lignes: { chambre: true } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Réservation introuvable.');
      if (
        ![
          StatutReservationEnum.EN_ATTENTE,
          StatutReservationEnum.CONFIRMEE,
        ].includes(reservation.statut)
      ) {
        throw new ConflictException(
          'Seules les réservations en attente ou confirmées peuvent être modifiées.',
        );
      }

      const dateArrivee = dto.dateArrivee ?? reservation.dateArrivee;
      const dateDepart = dto.dateDepart ?? reservation.dateDepart;
      const nombrePersonnes =
        dto.nombrePersonnes ?? reservation.nombrePersonnes;
      const idsChambres =
        dto.chambresIds ?? reservation.lignes.map((ligne) => ligne.chambre.id);
      const nombreNuits = validerPeriode(dateArrivee, dateDepart);
      const lignes = await this.preparerLignes(
        gestionnaire,
        idsChambres,
        dateArrivee,
        dateDepart,
        nombrePersonnes,
        id,
      );

      await gestionnaire.getRepository(LigneReservationEntity).delete({
        reservation: { id },
      });
      reservation.dateArrivee = dateArrivee;
      reservation.dateDepart = dateDepart;
      reservation.nombrePersonnes = nombrePersonnes;
      reservation.montantTotal = formaterMontant(
        lignes.reduce(
          (total, ligne) =>
            total + centimes(ligne.prixParNuit) * BigInt(nombreNuits),
          0n,
        ),
      );
      if (reservation.statut === StatutReservationEnum.EN_ATTENTE) {
        reservation.expireLe = new Date(
          Date.now() + DUREE_BLOCAGE_MINUTES * 60_000,
        );
      }
      reservation.lignes = lignes.map((ligne) =>
        gestionnaire.getRepository(LigneReservationEntity).create({
          prixParNuit: ligne.prixParNuit,
          nombreNuits,
          sousTotal: formaterMontant(
            centimes(ligne.prixParNuit) * BigInt(nombreNuits),
          ),
          reservation,
          chambre: ligne.chambre,
        }),
      );
      await repository.save(reservation);
      await this.audit.enregistrer(
        {
          action: 'MODIFICATION_RESERVATION',
          entite: 'Reservation',
          entiteId: id,
          details: { dateArrivee, dateDepart, nombrePersonnes, idsChambres },
          utilisateurId: utilisateur.id,
        },
        gestionnaire,
      );
      return repository.findOneOrFail({
        where: { id },
        relations: { client: true, lignes: { chambre: { typeChambre: true } } },
      });
    });
  }

  async changerStatut(
    id: number,
    statut: StatutReservationEnum,
    utilisateur: UtilisateurAuthentifie,
  ) {
    return this.source.transaction(async (gestionnaire) => {
      const repository = gestionnaire.getRepository(ReservationEntity);
      const reservation = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) throw new NotFoundException('Réservation introuvable.');
      if (!this.transitionAutorisee(reservation.statut, statut)) {
        throw new ConflictException(
          `Transition de statut interdite : ${reservation.statut} vers ${statut}.`,
        );
      }
      const aujourdHui = dateLocaleHotel(new Date());
      if (
        statut === StatutReservationEnum.EN_COURS &&
        aujourdHui < reservation.dateArrivee
      ) {
        throw new ConflictException(
          'Une réservation ne peut être marquée en cours avant la date d’arrivée.',
        );
      }
      if (
        statut === StatutReservationEnum.TERMINEE &&
        aujourdHui < reservation.dateDepart
      ) {
        throw new ConflictException(
          'Une réservation ne peut être terminée avant la date de départ.',
        );
      }
      reservation.statut = statut;
      if (statut !== StatutReservationEnum.EN_ATTENTE) {
        reservation.expireLe = null;
      }
      await repository.save(reservation);
      await this.audit.enregistrer(
        {
          action: 'CHANGEMENT_STATUT_RESERVATION',
          entite: 'Reservation',
          entiteId: id,
          details: { statut },
          utilisateurId: utilisateur.id,
        },
        gestionnaire,
      );
      return { id, numero: reservation.numero, statut: reservation.statut };
    });
  }

  private async preparerLignes(
    gestionnaire: EntityManager,
    chambresIds: number[],
    dateArrivee: string,
    dateDepart: string,
    nombrePersonnes: number,
    reservationIgnoreeId?: number,
  ): Promise<Array<{ chambre: ChambreEntity; prixParNuit: string }>> {
    if (new Set(chambresIds).size !== chambresIds.length) {
      throw new BadRequestException(
        'Une chambre ne peut apparaître qu’une fois.',
      );
    }
    const ids = [...chambresIds].sort((a, b) => a - b);
    await gestionnaire
      .createQueryBuilder(ChambreEntity, 'chambre')
      .setLock('pessimistic_write')
      .whereInIds(ids)
      .orderBy('chambre.id', 'ASC')
      .getMany();

    const chambres = await gestionnaire.getRepository(ChambreEntity).find({
      where: { id: In(ids) },
      relations: { typeChambre: true },
      order: { id: 'ASC' },
    });
    if (chambres.length !== ids.length) {
      throw new NotFoundException(
        'Une ou plusieurs chambres sont introuvables.',
      );
    }
    if (
      chambres.some(
        (chambre) =>
          chambre.statut !== StatutChambreEnum.DISPONIBLE ||
          !chambre.typeChambre.actif,
      )
    ) {
      throw new ConflictException(
        'Une ou plusieurs chambres ne sont pas ouvertes à la réservation.',
      );
    }
    const capacite = chambres.reduce(
      (total, chambre) => total + chambre.typeChambre.capacite,
      0,
    );
    if (nombrePersonnes > capacite) {
      throw new BadRequestException(
        `La capacité totale des chambres sélectionnées est de ${capacite} personne(s).`,
      );
    }

    const indisponibles = await this.chambresIndisponibles(
      gestionnaire,
      ids,
      dateArrivee,
      dateDepart,
      reservationIgnoreeId,
    );
    const conflit = chambres.find((chambre) => indisponibles.has(chambre.id));
    if (conflit) {
      throw new ConflictException(
        `La chambre ${conflit.numero} n’est plus disponible pour ces dates.`,
      );
    }
    return chambres.map((chambre) => ({
      chambre,
      prixParNuit: chambre.typeChambre.prixDeBase,
    }));
  }

  private async chambresIndisponibles(
    gestionnaire: EntityManager,
    chambresIds: number[],
    dateArrivee: string,
    dateDepart: string,
    reservationIgnoreeId?: number,
  ): Promise<Set<number>> {
    if (!chambresIds.length) return new Set();
    const query = gestionnaire
      .getRepository(LigneReservationEntity)
      .createQueryBuilder('ligne')
      .innerJoin('ligne.chambre', 'chambre')
      .innerJoin('ligne.reservation', 'reservation')
      .select('chambre.id', 'chambreId')
      .where('chambre.id IN (:...chambresIds)', { chambresIds })
      .andWhere('reservation.dateArrivee < :dateDepart', { dateDepart })
      .andWhere('reservation.dateDepart > :dateArrivee', { dateArrivee })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'reservation.statut = :attente AND reservation.expireLe > :instant',
            {
              attente: StatutReservationEnum.EN_ATTENTE,
              instant: new Date(),
            },
          ).orWhere('reservation.statut IN (:...statuts)', {
            statuts: [
              StatutReservationEnum.CONFIRMEE,
              StatutReservationEnum.EN_COURS,
            ],
          });
        }),
      );
    if (reservationIgnoreeId !== undefined) {
      query.andWhere('reservation.id != :reservationIgnoreeId', {
        reservationIgnoreeId,
      });
    }
    const lignes = await query.getRawMany<{ chambreId: number }>();
    const indisponibilites = await gestionnaire
      .getRepository(IndisponibiliteChambreEntity)
      .createQueryBuilder('indisponibilite')
      .innerJoin('indisponibilite.chambre', 'chambre')
      .select('chambre.id', 'chambreId')
      .where('chambre.id IN (:...chambresIds)', { chambresIds })
      .andWhere('indisponibilite.dateDebut < :dateDepart', { dateDepart })
      .andWhere('indisponibilite.dateFin > :dateArrivee', { dateArrivee })
      .getRawMany<{ chambreId: number }>();
    return new Set(
      [...lignes, ...indisponibilites].map((ligne) => Number(ligne.chambreId)),
    );
  }

  private verifierPeriodePlanning(debut: string, fin: string): void {
    const dateValide = (value: string) => {
      const timestamp = Date.parse(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(timestamp) &&
        new Date(timestamp).toISOString().slice(0, 10) === value
      );
    };
    const duree =
      Date.parse(`${fin}T00:00:00.000Z`) - Date.parse(`${debut}T00:00:00.000Z`);
    if (
      !dateValide(debut) ||
      !dateValide(fin) ||
      fin <= debut ||
      duree > 62 * 86_400_000
    ) {
      throw new BadRequestException('La période du planning est invalide.');
    }
  }

  private transitionAutorisee(
    origine: StatutReservationEnum,
    destination: StatutReservationEnum,
  ): boolean {
    const transitions: Record<StatutReservationEnum, StatutReservationEnum[]> =
      {
        [StatutReservationEnum.EN_ATTENTE]: [
          StatutReservationEnum.CONFIRMEE,
          StatutReservationEnum.ANNULEE,
        ],
        [StatutReservationEnum.CONFIRMEE]: [
          StatutReservationEnum.EN_COURS,
          StatutReservationEnum.ANNULEE,
        ],
        [StatutReservationEnum.EN_COURS]: [StatutReservationEnum.TERMINEE],
        [StatutReservationEnum.TERMINEE]: [],
        [StatutReservationEnum.ANNULEE]: [],
      };
    return transitions[origine].includes(destination);
  }

  private genererNumero(): string {
    const suffixe = randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
    return `RSV-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${suffixe}`;
  }
}
