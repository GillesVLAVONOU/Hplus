import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { TypeChambreEntity } from './entities/type-chambre.entity/type-chambre.entity.js';
import { TypesChambresController } from './types-chambres.controller.js';
import { TypesChambresService } from './types-chambres.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TypeChambreEntity]), AuditModule],
  controllers: [TypesChambresController],
  providers: [TypesChambresService],
  exports: [TypesChambresService],
})
export class TypesChambresModule {}
