import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './jwt.strategy';

function readRefreshToken(req: Request): string | null {
  const body = req.body as { refreshToken?: unknown } | undefined;
  const token = body?.refreshToken;
  return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => readRefreshToken(req),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
