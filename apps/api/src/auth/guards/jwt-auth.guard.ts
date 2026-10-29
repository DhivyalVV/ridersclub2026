import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccountStatus, UserRole, type AuthenticatedUserAccount } from '@ridersclub/types';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserAccount;
  sessionId?: string;
}

export function extractBearerOrCookieToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('rc_access_token='));
    if (match) {
      return decodeURIComponent(match.slice('rc_access_token='.length));
    }
  }

  return null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerOrCookieToken(req);

    if (!token) {
      throw new UnauthorizedException('Authentication required. Please sign in.');
    }

    const payload = this.tokenService.verifyAccessToken(token);
    const user = await this.authService.validateSessionAndGetUser(
      payload.sub,
      payload.sessionId,
    );

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        `Your account status is ${user.accountStatus}. Access is restricted.`,
      );
    }

    req.user = user;
    req.sessionId = payload.sessionId;
    return true;
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerOrCookieToken(req);

    if (!token) {
      return true;
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      const user = await this.authService.validateSessionAndGetUser(
        payload.sub,
        payload.sessionId,
      );
      if (user.accountStatus === AccountStatus.ACTIVE) {
        req.user = user;
        req.sessionId = payload.sessionId;
      }
    } catch {
      // Ignore invalid/expired token on optional public routes
    }

    return true;
  }
}

export const ROLES_KEY = 'ridersclub:roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const handlerRoles = Reflect.getMetadata(ROLES_KEY, context.getHandler()) as
      | UserRole[]
      | undefined;
    const classRoles = Reflect.getMetadata(ROLES_KEY, context.getClass()) as
      | UserRole[]
      | undefined;
    const requiredRoles = handlerRoles ?? classRoles;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions for this operation.');
    }

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUserAccount | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

