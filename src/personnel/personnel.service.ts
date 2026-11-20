import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto/creer-utilisateur.dto.js';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto/modifier-utilisateur.dto.js';
import { UtilisateurPersonnelEntity } from './entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';

@Injectable()
export class PersonnelService {
  constructor(
    @InjectRepository(UtilisateurPersonnelEntity)
    private readonly personnel: Repository<UtilisateurPersonnelEntity>,
    @InjectRepository(ClientEntity)
    private readonly clients: Repository<ClientEntity>,
    private readonly audit: AuditService,
  ) {}

  async lister(page: number, limite: number) {
    const [utilisateurs, total] = await this.personnel.findAndCount({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        actif: true,
      },
      order: { nom: 'ASC', prenom: 'ASC' },
      skip: (page - 1) * limite,
      take: limite,
    });
    return { utilisateurs, total, page, limite };
  }

  async creer(
    dto: CreerUtilisateurDto,
    auteur: UtilisateurAuthentifie,
  ) {
    const email = dto.email.trim().toLowerCase();
    const [personnelExistant, clientExistant] = await Promise.all([
      this.personnel
        .createQueryBuilder('personnel')
        .where('LOWER(personnel.email) = :email', { email })
        .getExists(),
      this.clients
        .createQueryBuilder('client')
        .where('LOWER(client.email) = :email', { email })
        .getExists(),
    ]);
    if (personnelExistant || clientExistant) {
      throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
    }
    const utilisateur = await this.personnel.save(
      this.personnel.create({
        nom: dto.nom.trim(),
        prenom: dto.prenom.trim(),
        email,
        role: dto.role,
        actif: true,
        motDePasseHache: await bcrypt.hash(dto.motDePasse, 12),
      }),
    );
    await this.audit.enregistrer({
      action: 'CREATION_COMPTE_PERSONNEL',
      entite: 'UtilisateurPersonnel',
      entiteId: utilisateur.id,
      details: { email, role: utilisateur.role },
      utilisateurId: auteur.id,
    });
    return this.sansMotDePasse(utilisateur);
  }

  async modifier(
    id: number,
    dto: ModifierUtilisateurDto,
    auteur: UtilisateurAuthentifie,
  ) {
    const utilisateur = await this.personnel.findOneBy({ id });
    if (!utilisateur) throw new NotFoundException('Membre du personnel introuvable.');
    const perdSonRoleAdmin =
      utilisateur.actif &&
      utilisateur.role === RoleEnum.ADMINISTRATEUR &&
      (dto.actif === false || dto.role === RoleEnum.RECEPTIONNISTE);
    if (
      perdSonRoleAdmin &&
      (await this.personnel.countBy({
        role: RoleEnum.ADMINISTRATEUR,
        actif: true,
      })) <= 1
    ) {
      throw new ConflictException(
        'Le dernier administrateur actif ne peut pas être désactivé ni rétrogradé.',
      );
    }
    if (dto.nom !== undefined) utilisateur.nom = dto.nom.trim();
    if (dto.prenom !== undefined) utilisateur.prenom = dto.prenom.trim();
    if (dto.role !== undefined) utilisateur.role = dto.role;
    if (dto.actif !== undefined) utilisateur.actif = dto.actif;
    const saved = await this.personnel.save(utilisateur);
    await this.audit.enregistrer({
      action: 'MODIFICATION_COMPTE_PERSONNEL',
      entite: 'UtilisateurPersonnel',
      entiteId: id,
      details: {
        nom: dto.nom,
        prenom: dto.prenom,
        role: dto.role,
        actif: dto.actif,
      },
      utilisateurId: auteur.id,
    });
    return this.sansMotDePasse(saved);
  }

  private sansMotDePasse(utilisateur: UtilisateurPersonnelEntity) {
    const { motDePasseHache: _motDePasseHache, ...sansMotDePasse } = utilisateur;
    return sansMotDePasse;
  }
}
