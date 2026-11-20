import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RoleEnum } from '../../enums/role.enum/role.enum.js';
import { TypeCompteEnum } from '../../dto/connexion.dto/connexion.dto.js';

export interface UtilisateurAuthentifie {
  id: number;
  role: RoleEnum;
  typeCompte: TypeCompteEnum;
}

interface JetonAuthentification {
  sub: number;
  role: RoleEnum;
  typeCompte: TypeCompteEnum;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { headers?: { cookie?: string } }) => {
          const cookies = request.headers?.cookie;
          if (!cookies) return null;
          const accessToken = cookies
            .split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith('hplus_access_token='))
            ?.slice('hplus_access_token='.length);
          return accessToken ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JetonAuthentification): UtilisateurAuthentifie {
    if (
      !Number.isInteger(payload.sub) ||
      !Object.values(RoleEnum).includes(payload.role) ||
      !Object.values(TypeCompteEnum).includes(payload.typeCompte)
    ) {
      throw new UnauthorizedException('Jeton invalide.');
    }

    return {
      id: payload.sub,
      role: payload.role,
      typeCompte: payload.typeCompte,
    };
  }
}
