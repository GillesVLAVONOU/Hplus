import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UtilisateurConnecte } from '../authentification/decorators/utilisateur-connecte.decorator/utilisateur-connecte.decorator.js';
import { Roles } from '../authentification/decorators/roles.decorator/roles.decorator.js';
import { JwtAuthGuard } from '../authentification/guards/jwt-auth.guard/jwt-auth.guard.js';
import { RolesGuard } from '../authentification/guards/roles.guard/roles.guard.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import type { UtilisateurAuthentifie } from '../authentification/strategies/jwt.strategy/jwt.strategy.js';
import { CreerChambreDto } from './dto/creer-chambre.dto/creer-chambre.dto.js';
import { ModifierChambreDto } from './dto/modifier-chambre.dto/modifier-chambre.dto.js';
import { ChambresService } from './chambres.service.js';

@Controller('chambres')
export class ChambresController {
  constructor(private readonly chambresService: ChambresService) {}

  @Get()
  lister() {
    return this.chambresService.lister();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMINISTRATEUR)
  @UseInterceptors(
    FilesInterceptor('images', 8, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_requete, fichier, callback) => {
        const formatsAutorises = ['image/jpeg', 'image/png', 'image/webp'];
        if (!formatsAutorises.includes(fichier.mimetype)) {
          callback(
            new BadRequestException('Les images doivent être au format JPEG, PNG ou WebP.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  creer(
    @Body() dto: CreerChambreDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
    @UploadedFiles() images: Express.Multer.File[] = [],
  ) {
    return this.chambresService.creer(dto, utilisateur, images);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMINISTRATEUR)
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierChambreDto,
    @UtilisateurConnecte() utilisateur: UtilisateurAuthentifie,
  ) {
    return this.chambresService.modifier(id, dto, utilisateur);
  }
}
