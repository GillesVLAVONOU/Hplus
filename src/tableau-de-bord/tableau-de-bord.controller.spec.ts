import { Test, TestingModule } from '@nestjs/testing';
import { TableauDeBordController } from './tableau-de-bord.controller.js';
import { TableauDeBordService } from './tableau-de-bord.service.js';

describe('TableauDeBordController', () => {
  let controller: TableauDeBordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TableauDeBordController],
      providers: [{ provide: TableauDeBordService, useValue: {} }],
    }).compile();

    controller = module.get<TableauDeBordController>(TableauDeBordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
