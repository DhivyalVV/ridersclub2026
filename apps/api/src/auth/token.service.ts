import { createHmac, randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@ridersclub/types';

export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

@Injectable()
export class TokenService {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev-only-jwt-access-secret-change-in-production-min-32-chars',
    );
  }

  generateNumericOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  hashValue(rawValue: string): string {
    return createHash('sha256').update(`${rawValue}:${this.secret}`).digest('hex');
  }

  verifyHash(rawValue: string, expectedHash: string): boolean {
    const candidateHash = this.hashValue(rawValue);
    const a = Buffer.from(candidateHash, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  signAccessToken(params: {
    userId: string;
    role: UserRole;
    sessionId: string;
    ttlSeconds?: number;
  }): { token: string; expiresAt: Date } {
    const ttl = params.ttlSeconds ?? 60 * 60 * 24; // 24 hours default for smooth local/mobile session
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ttl;

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
      'base64url',
    );
    const payload: JwtAccessPayload = {
      sub: params.userId,
      role: params.role,
      sessionId: params.sessionId,
      iat,
      exp,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${header}.${encodedPayload}`;
    const signature = createHmac('sha256', this.secret)
      .update(signingInput)
      .digest('base64url');

    return {
      token: `${signingInput}.${signature}`,
      expiresAt: new Date(exp * 1000),
    };
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed authentication token.');
    }

    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = createHmac('sha256', this.secret)
      .update(signingInput)
      .digest('base64url');

    const sigBuffer = Buffer.from(signatureB64, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid authentication token signature.');
    }

    let payload: JwtAccessPayload;
    try {
      payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      ) as JwtAccessPayload;
    } catch {
      throw new UnauthorizedException('Invalid authentication token payload.');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= nowSeconds) {
      throw new UnauthorizedException('Authentication token has expired.');
    }

    return payload;
  }
}

