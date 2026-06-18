import { SetMetadata } from '@nestjs/common';
import { AUTH_KEY, PUBLIC_KEY } from './auth.constants';
import { AppRole } from './auth.types';

export const Roles = (...roles: AppRole[]) => SetMetadata(AUTH_KEY, roles);
export const Public = () => SetMetadata(PUBLIC_KEY, true);
