import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../authentification/decorators/roles.decorator/roles.decorator.js';
import { JwtAuthGuard } from '../authentification/guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from '../authentification/guards/roles.guard/roles.guard.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import { TableauDeBordService } from './tableau-de-bord.service.js';

@Controller('tableau-de-bord')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.RECEPTIONNISTE, RoleEnum.ADMINISTRATEUR)
export class TableauDeBordController {
  constructor(private readonly tableauService: TableauDeBordService) {}

  @Get()
  obtenirIndicateurs() {
    return this.tableauService.obtenirIndicateurs();
  }
}
