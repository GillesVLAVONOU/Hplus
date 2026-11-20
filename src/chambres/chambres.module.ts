import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { TypeChambreEntity } from '../types-chambres/entities/type-chambre.entity/type-chambre.entity.js';
import { ChambreEntity } from './entities/chambre.entity/chambre.entity.js';
import { ChambresController } from './chambres.controller.js';
import { ChambresService } from './chambres.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChambreEntity, TypeChambreEntity]),
    AuditModule,
  ],
  controllers: [ChambresController],
  providers: [ChambresService],
  exports: [ChambresService],
})
export class ChambresModule {}
