import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../authentification/guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from '../authentification/guards/roles.guard/roles.guard.js';
import { Roles } from '../authentification/decorators/roles.decorator/roles.decorator.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import { AuditService } from './audit.service.js';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMINISTRATEUR)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  lister(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limite', new DefaultValuePipe(25), ParseIntPipe) limite: number,
  ) {
    return this.auditService.lister(
      Math.max(1, page),
      Math.min(100, Math.max(1, limite)),
    );
  }
}
