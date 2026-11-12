import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';

// JWT guard. Verification is delegated to JwtService; swapping to Cognito means
// replacing `verifyAsync` with a JWKS-backed check, not touching call sites.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = this.extract(req);
    if (!token) throw new UnauthorizedException('Missing bearer token');
    try {
      req.user = await this.jwt.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extract(req: { headers?: { authorization?: string } }): string | undefined {
    const header = req.headers?.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
