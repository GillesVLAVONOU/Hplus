const { comparePassword } = vi.hoisted(() => ({ comparePassword: vi.fn() }));
vi.mock('bcrypt', async (importOriginal) => ({
  ...await importOriginal<typeof import('bcrypt')>(),
  compare: comparePassword,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { AuthentificationService } from './authentification.service.js';
import { RoleEnum } from './enums/role.enum/role.enum.js';
import { TypeCompteEnum } from './dto/connexion.dto/connexion.dto.js';

describe('AuthentificationService', () => {
  let service: AuthentificationService;
  let client: ClientEntity;
  let membrePersonnel: UtilisateurPersonnelEntity;
  let jwt: { signAsync: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    comparePassword.mockReset();
    comparePassword.mockImplementation(async (_password: string, hash: string) =>
      hash === 'personnel-hash',
    );
    client = Object.assign(new ClientEntity(), {
      id: 1,
      nom: 'Client',
      prenom: 'Test',
      email: 'membre@example.com',
      motDePasseHache: 'client-hash',
      actif: true,
    });
    membrePersonnel = Object.assign(new UtilisateurPersonnelEntity(), {
      id: 2,
      nom: 'Personnel',
      prenom: 'Test',
      email: 'membre@example.com',
      motDePasseHache: 'personnel-hash',
      role: RoleEnum.RECEPTIONNISTE,
      actif: true,
    });
    const createQuery = (getOne: () => Promise<unknown>) => ({
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne,
    });
    const clients = {
      createQueryBuilder: vi.fn(() => createQuery(async () => client)),
    };
    const personnel = {
      createQueryBuilder: vi.fn(() => createQuery(async () => membrePersonnel)),
    };
    jwt = { signAsync: vi.fn().mockResolvedValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthentificationService,
        { provide: getRepositoryToken(ClientEntity), useValue: clients },
        { provide: getRepositoryToken(UtilisateurPersonnelEntity), useValue: personnel },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthentificationService>(AuthentificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('authenticates a personnel account without requiring its account type', async () => {
    const result = await service.seConnecter({
      email: ' Membre@Example.com ',
      motDePasse: 'secret',
    });

    expect(result.utilisateur).toEqual({
      id: membrePersonnel.id,
      email: membrePersonnel.email,
      nom: membrePersonnel.nom,
      prenom: membrePersonnel.prenom,
      role: RoleEnum.RECEPTIONNISTE,
      typeCompte: TypeCompteEnum.PERSONNEL,
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: membrePersonnel.id,
      role: RoleEnum.RECEPTIONNISTE,
      typeCompte: TypeCompteEnum.PERSONNEL,
    });
  });

  it('rejects credentials that match multiple active accounts', async () => {
    comparePassword.mockResolvedValue(true);

    await expect(service.seConnecter({
      email: client.email,
      motDePasse: 'secret',
    })).rejects.toThrow(
      'Plusieurs comptes actifs correspondent à ces identifiants. Contactez un administrateur.',
    );
  });
});
