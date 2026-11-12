import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = { sub: string; email: string };

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest();
  return req.user as AuthUser;
});
