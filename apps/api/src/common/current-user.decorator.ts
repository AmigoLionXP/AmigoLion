import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: string; // user id
  email: string;
  role: 'public' | 'client' | 'rep' | 'admin';
  companyId?: string; // set for role=client
  repId?: string; // set for role=rep
}

/** Pulls the JWT-resolved caller off the request (set by JwtStrategy). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});
