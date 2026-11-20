import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { TableauDeBordService } from './tableau-de-bord.service.js';

describe('TableauDeBordService', () => {
  let service: TableauDeBordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableauDeBordService,
        { provide: getDataSourceToken(), useValue: {} },
      ],
    }).compile();

    service = module.get<TableauDeBordService>(TableauDeBordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
