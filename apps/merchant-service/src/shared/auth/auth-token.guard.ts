import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_KEY } from './auth.constants';
import { verifyAccessToken } from './jwt.utils';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice('Bearer '.length).trim();
    const signingKey = process.env.JWT_SIGNING_KEY;
    if (!signingKey) {
      throw new UnauthorizedException('JWT_SIGNING_KEY is not configured');
    }

    request.auth = verifyAccessToken(token, signingKey);
    return true;
  }
}
