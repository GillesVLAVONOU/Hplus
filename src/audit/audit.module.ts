import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthentificationModule } from '../authentification/authentification.module.js';
import { JournalAuditEntity } from './entities/journal-audit.entity/journal-audit.entity.js';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([JournalAuditEntity]),
    AuthentificationModule,
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
