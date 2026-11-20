import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../audit/audit.service.js';
import { ClientEntity } from '../clients/entities/client.entity/client.entity.js';
import { UtilisateurPersonnelEntity } from './entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';
import { PersonnelService } from './personnel.service.js';

describe('PersonnelService', () => {
  let service: PersonnelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonnelService,
        { provide: getRepositoryToken(UtilisateurPersonnelEntity), useValue: {} },
        { provide: getRepositoryToken(ClientEntity), useValue: {} },
        { provide: AuditService, useValue: {} },
      ],
    }).compile();

    service = module.get<PersonnelService>(PersonnelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
