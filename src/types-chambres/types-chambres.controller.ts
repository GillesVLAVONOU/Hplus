import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UtilisateurConnecte } from '../authentification/decorators/utilisateur-connecte.decorator/utilisateur-connecte.decorator.js';
import { Roles } from '../authentification/decorators/roles.decorator/roles.decorator.js';
import { JwtAuthGuard } from '../authentification/guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from '../authentification/guards/roles.guard/roles.guard.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import type { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { CreerTypeChambreDto } from './dto/creer-type-chambre.dto/creer-type-chambre.dto.js';
import { ModifierTypeChambreDto } from './dto/modifier-type-chambre.dto/modifier-type-chambre.dto.js';
import { TypesChambresService } from './types-chambres.service.js';

@Controller('types-chambres')
export class TypesChambresController {
  constructor(private readonly typesService: TypesChambresService) {}

  @Get()
  lister() {
    return this.typesService.lister();
  }

  @Get('tous')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMINISTRATEUR)
  listerTous() {
    return this.typesService.lister(false);
  }

  @Get(':id')
  obtenir(@Param('id', ParseIntPipe) id: number) {
    return this.typesService.obtenir(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMINISTRATEUR)
  creer(
    @Body() dto: CreerTypeChambreDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.typesService.creer(dto, utilisateur);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMINISTRATEUR)
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierTypeChambreDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.typesService.modifier(id, dto, utilisateur);
  }
}
