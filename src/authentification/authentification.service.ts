import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { RoleEnum } from './enums/role.enum/role.enum.js';
import { ConnexionDto, TypeCompteEnum } from './dto/connexion.dto/connexion.dto.js';
import { InscriptionDto } from './dto/inscription.dto/inscription.dto.js';

@Injectable()
export class AuthentificationService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clients: Repository<ClientEntity>,
    @InjectRepository(UtilisateurPersonnelEntity)
    private readonly personnel: Repository<UtilisateurPersonnelEntity>,
    private readonly jwt: JwtService,
  ) {}

  async inscrireClient(dto: InscriptionDto): Promise<{ id: number; email: string }> {
    const email = dto.email.trim().toLowerCase();
    const [clientExistant, personnelExistant] = await Promise.all([
      this.clients
        .createQueryBuilder('client')
        .where('LOWER(client.email) = :email', { email })
        .getOne(),
      this.personnel
        .createQueryBuilder('personnel')
        .where('LOWER(personnel.email) = :email', { email })
        .getOne(),
    ]);
    if (clientExistant || personnelExistant) {
      throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
    }

    const client = this.clients.create({
      nom: dto.nom.trim(),
      prenom: dto.prenom.trim(),
      email,
      telephone: dto.telephone?.trim() || null,
      motDePasseHache: await bcrypt.hash(dto.motDePasse, 12),
      actif: true,
    });
    const enregistre = await this.clients.save(client);
    return { id: enregistre.id, email: enregistre.email };
  }

  async seConnecter(dto: ConnexionDto) {
    const email = dto.email.trim().toLowerCase();
    const [client, membrePersonnel] = await Promise.all([
      this.clients
        .createQueryBuilder('client')
        .addSelect('client.motDePasseHache')
        .where('LOWER(client.email) = :email', { email })
        .getOne(),
      this.personnel
        .createQueryBuilder('personnel')
        .addSelect('personnel.motDePasseHache')
        .where('LOWER(personnel.email) = :email', { email })
        .getOne(),
    ]);

    const [clientValide, personnelValide] = await Promise.all([
      client?.actif
        ? bcrypt.compare(dto.motDePasse, client.motDePasseHache)
        : Promise.resolve(false),
      membrePersonnel?.actif
        ? bcrypt.compare(dto.motDePasse, membrePersonnel.motDePasseHache)
        : Promise.resolve(false),
    ]);
    const comptesValides = [
      clientValide && client
        ? { compte: client, typeCompte: TypeCompteEnum.CLIENT, role: RoleEnum.CLIENT }
        : null,
      personnelValide && membrePersonnel
        ? {
            compte: membrePersonnel,
            typeCompte: TypeCompteEnum.PERSONNEL,
            role: membrePersonnel.role,
          }
        : null,
    ].filter((compte) => compte !== null);

    if (comptesValides.length > 1) {
      throw new ConflictException(
        'Plusieurs comptes actifs correspondent à ces identifiants. Contactez un administrateur.',
      );
    }

    const authentification = comptesValides[0];
    if (!authentification) {
      throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    }

    const { compte, typeCompte, role } = authentification;
    const accessToken = await this.jwt.signAsync({
      sub: compte.id,
      role,
      typeCompte,
    });

    return {
      accessToken,
      utilisateur: {
        id: compte.id,
        email: compte.email,
        nom: compte.nom,
        prenom: compte.prenom,
        role,
        typeCompte,
      },
    };
  }

  async obtenirUtilisateur(id: number, typeCompte: TypeCompteEnum) {
    if (typeCompte === TypeCompteEnum.CLIENT) {
      const compte = await this.clients.findOne({
        where: { id, actif: true },
        select: { id: true, email: true, nom: true, prenom: true },
      });
      if (!compte) throw new UnauthorizedException('Session invalide.');
      return { ...compte, role: RoleEnum.CLIENT, typeCompte };
    }
    const compte = await this.personnel.findOne({
      where: { id, actif: true },
      select: { id: true, email: true, nom: true, prenom: true, role: true },
    });
    if (!compte) throw new UnauthorizedException('Session invalide.');
    return { ...compte, typeCompte };
  }
}
