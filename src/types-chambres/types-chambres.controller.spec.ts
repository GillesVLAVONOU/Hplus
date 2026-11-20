import { Test, TestingModule } from '@nestjs/testing';
import { TypesChambresController } from './types-chambres.controller.js';
import { TypesChambresService } from './types-chambres.service.js';

describe('TypesChambresController', () => {
  let controller: TypesChambresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypesChambresController],
      providers: [{ provide: TypesChambresService, useValue: {} }],
    }).compile();

    controller = module.get<TypesChambresController>(TypesChambresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
