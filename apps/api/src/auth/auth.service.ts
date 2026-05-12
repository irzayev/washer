import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email, user.role, user.branchId);
  }

  refreshFromUser(user: AuthUser) {
    return this.issueTokens(user.userId, user.email, user.role, user.branchId);
  }

  private issueTokens(
    userId: string,
    email: string,
    role: string,
    branchId: string | null,
  ) {
    const accessTtl = Number(this.config.get('JWT_ACCESS_TTL_SEC') ?? 900);
    const refreshTtl = Number(this.config.get('JWT_REFRESH_TTL_SEC') ?? 604800);
    const payload: JwtPayload = { sub: userId, email, role, branchId };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessTtl,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
      user: { id: userId, email, role, branchId },
    };
  }
}
