import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientEntity } from './entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { ClientsService } from './clients.service.js';

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(ClientEntity), useValue: {} },
        { provide: getRepositoryToken(UtilisateurPersonnelEntity), useValue: {} },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
