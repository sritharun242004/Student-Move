import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  id?: string;
  sub?: string;
  userId?: string;
  user_id?: string;
  role?: "merchant" | "admin" | "student" | "tenant" | "landlord" | "agent";
}

export interface GatewayJwtUser {
  id: string;
  role: "merchant" | "admin" | "student" | "tenant" | "landlord" | "agent";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secretOrKey =
      configService.get<string>('JWT_SIGNING_KEY') ?? process.env.JWT_SIGNING_KEY;

    if (!secretOrKey) {
      throw new Error('JWT_SIGNING_KEY is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  validate(payload: JwtPayload): GatewayJwtUser {
    const id = payload.user_id;
    const role = payload.role;

    if (!id || !role) {
      throw new UnauthorizedException('Invalid token claims');
    }

    return { id, role };
  }
}
