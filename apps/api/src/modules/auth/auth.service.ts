import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { LoginInput, AuthTokens, AuthUserDto } from '@washer/types';

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? '';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? '';
  private readonly accessTtl = process.env.JWT_ACCESS_TTL ?? '15m';
  private readonly refreshTtlDays = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(input: LoginInput, ip?: string, ua?: string): Promise<AuthTokens & { user: AuthUserDto }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.branchId, ip, ua);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  async refresh(refreshToken: string, ip?: string, ua?: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    return this.issueTokens(user.id, user.email, user.role, user.branchId, ip, ua);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken
      .updateMany({ where: { tokenHash }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    branchId: string | null,
    ip?: string,
    ua?: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role, branchId },
      { secret: this.accessSecret, expiresIn: this.accessTtl },
    );

    const refreshTokenRaw = randomBytes(48).toString('base64url');
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti: refreshTokenRaw },
      { secret: this.refreshSecret, expiresIn: `${this.refreshTtlDays}d` },
    );

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, ip, userAgent: ua?.slice(0, 255) },
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
