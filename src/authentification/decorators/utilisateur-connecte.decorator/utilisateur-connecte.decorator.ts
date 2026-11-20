import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UtilisateurAuthentifie } from '../../strategies/jwt.strategy/jwt.strategy.js';

export const UtilisateurConnecte = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UtilisateurAuthentifie => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: UtilisateurAuthentifie }>();
    return request.user;
  },
);
