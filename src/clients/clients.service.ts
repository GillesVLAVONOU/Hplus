import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { ClientEntity } from './entities/client.entity/client.entity.js';
import { ModifierClientDto } from './dto/modifier-client.dto/modifier-client.dto.js';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clients: Repository<ClientEntity>,
    @InjectRepository(UtilisateurPersonnelEntity)
    private readonly personnel: Repository<UtilisateurPersonnelEntity>,
  ) {}

  async obtenirProfil(utilisateur: UtilisateurAuthentifie) {
    if (utilisateur.typeCompte !== 'CLIENT') {
      throw new ForbiddenException('Cette route est réservée aux clients.');
    }
    const client = await this.clients.findOne({
      where: { id: utilisateur.id, actif: true },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        actif: true,
      },
    });
    if (!client) throw new NotFoundException('Client introuvable.');
    return client;
  }

  async modifierProfil(
    utilisateur: UtilisateurAuthentifie,
    dto: ModifierClientDto,
  ) {
    if (utilisateur.typeCompte !== 'CLIENT') {
      throw new ForbiddenException('Cette route est réservée aux clients.');
    }
    const client = await this.clients.findOneBy({
      id: utilisateur.id,
      actif: true,
    });
    if (!client) throw new NotFoundException('Client introuvable.');
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const autreClient = await this.clients
        .createQueryBuilder('client')
        .where('LOWER(client.email) = :email', { email })
        .andWhere('client.id != :id', { id: client.id })
        .getOne();
      if (autreClient) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
      const personnelExistant = await this.personnel
        .createQueryBuilder('personnel')
        .where('LOWER(personnel.email) = :email', { email })
        .getExists();
      if (personnelExistant) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
    }
    if (dto.nom !== undefined) client.nom = dto.nom.trim();
    if (dto.prenom !== undefined) client.prenom = dto.prenom.trim();
    if (dto.email !== undefined) client.email = dto.email.trim().toLowerCase();
    if (dto.telephone !== undefined) {
      client.telephone = dto.telephone.trim() || null;
    }
    const saved = await this.clients.save(client);
    return {
      id: saved.id,
      nom: saved.nom,
      prenom: saved.prenom,
      email: saved.email,
      telephone: saved.telephone,
    };
  }

  async lister(page: number, limite: number) {
    const [clients, total] = await this.clients.findAndCount({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        actif: true,
      },
      order: { nom: 'ASC', prenom: 'ASC' },
      skip: (page - 1) * limite,
      take: limite,
    });
    return { clients, total, page, limite };
  }
}
