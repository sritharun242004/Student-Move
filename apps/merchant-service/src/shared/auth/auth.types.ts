import { Request } from 'express';

export const APP_ROLES = {
  ADMIN: 'admin',
  MERCHANT: 'merchant',
  STUDENT: 'student',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export interface AuthClaims {
  userId: string;
  role: string;
  tokenType: string;
  exp: number;
  email?: string;
  phone?: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthClaims;
}
