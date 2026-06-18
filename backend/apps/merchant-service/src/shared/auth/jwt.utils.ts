import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthClaims } from './auth.types';

const fromBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
};

const toBase64Url = (value: Buffer): string =>
  value
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const parsePart = (part: string): Record<string, unknown> => {
  try {
    return JSON.parse(fromBase64Url(part)) as Record<string, unknown>;
  } catch {
    throw new UnauthorizedException('Invalid token format');
  }
};

export const verifyAccessToken = (token: string, signingKey: string): AuthClaims => {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new UnauthorizedException('Malformed token');
  }

  const header = parsePart(headerPart);
  if (header.alg !== 'HS256') {
    throw new UnauthorizedException('Unsupported token algorithm');
  }

  const content = `${headerPart}.${payloadPart}`;
  const expectedSignature = toBase64Url(
    createHmac('sha256', signingKey).update(content).digest(),
  );

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(signaturePart, 'utf8');
  const isValidLength = expectedBuffer.length === actualBuffer.length;
  const validSignature =
    isValidLength && timingSafeEqual(expectedBuffer, actualBuffer);

  if (!validSignature) {
    throw new UnauthorizedException('Invalid token signature');
  }

  const payload = parsePart(payloadPart);

  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Token has expired');
  }

  const tokenType = String(payload.token_type ?? '');
  if (tokenType !== 'access') {
    throw new UnauthorizedException('Invalid token type');
  }

  const userId = String(payload.userId ?? payload.sub ?? '');
  const role = String(payload.role ?? '');
  if (!userId || !role) {
    throw new UnauthorizedException('Invalid token claims');
  }

  return {
    userId,
    role,
    tokenType,
    exp,
    email: payload.email ? String(payload.email) : undefined,
    phone: payload.phone ? String(payload.phone) : undefined,
  };
};
