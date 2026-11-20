import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard/jwt-auth.guard.js';
import type { UtilisateurAuthentifie } from './strategies/jwt.strategy/jwt.strategy.js';
import { AuthentificationService } from './authentification.service.js';
import { ConnexionDto } from './dto/connexion.dto/connexion.dto.js';

@Controller('authentification')
export class AuthentificationController {
  constructor(
    private readonly authentificationService: AuthentificationService,
    private readonly config: ConfigService,
  ) {}

  @Post('connexion')
  async seConnecter(
    @Body() dto: ConnexionDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, utilisateur } =
      await this.authentificationService.seConnecter(dto);
    response.cookie('hplus_access_token', accessToken, this.optionsCookie());
    return { utilisateur };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async obtenirSession(@Req() request: Request & { user: UtilisateurAuthentifie }) {
    const { id, typeCompte } = request.user;
    return {
      utilisateur: await this.authentificationService.obtenirUtilisateur(
        id,
        typeCompte,
      ),
    };
  }

  @Post('deconnexion')
  deconnecter(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('hplus_access_token', this.optionsCookie());
    return { ok: true };
  }

  private optionsCookie() {
    const maxAge = Number.parseInt(
      this.config.get<string>('JWT_EXPIRATION_SECONDS', '28800'),
      10,
    );
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/api',
      maxAge: maxAge * 1000,
    };
  }
}
