import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type AuthUser = {
  userId: string;
  email: string;
  role: string;
  branchId: string | null;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!req.user) {
      throw new Error('Missing authenticated user');
    }
    return req.user;
  },
);
