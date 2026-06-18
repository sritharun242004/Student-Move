import type { Request } from 'express';
import type { GatewayJwtUser } from './jwt.strategy';

export type AuthenticatedRequest = Request & {
  user: GatewayJwtUser;
};
