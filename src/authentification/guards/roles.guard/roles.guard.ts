import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '../../enums/role.enum/role.enum.js';
import { ROLES_KEY } from '../../decorators/roles.decorator/roles.decorator.js';
import { UtilisateurAuthentifie } from '../../strategies/jwt.strategy/jwt.strategy.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RoleEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: UtilisateurAuthentifie }>();
    return !!request.user && roles.includes(request.user.role);
  }
}
