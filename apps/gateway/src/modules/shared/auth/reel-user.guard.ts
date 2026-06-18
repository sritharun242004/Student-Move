import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from './authenticated-request.type';

const REEL_USER_ROLES = new Set(['tenant', 'landlord', 'agent', 'admin']);

@Injectable()
export class ReelUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!REEL_USER_ROLES.has(request.user?.role)) {
      throw new ForbiddenException('Reel access requires tenant, landlord, agent, or admin role');
    }

    return true;
  }
}
