import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@washer/db';

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser | unknown => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as RequestUser;
    return data ? user?.[data] : user;
  },
);
