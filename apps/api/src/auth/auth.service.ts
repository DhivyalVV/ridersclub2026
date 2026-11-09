import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountStatus,
  DirectMessagePrivacy,
  UserRole,
  type AuthenticatedUserAccount,
  type AuthSessionResponse,
  type OtpRequestResponse,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  GoogleSignInDto,
  LinkPhoneDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { SMS_PROVIDER_TOKEN, type SmsProvider } from './sms.provider';
import { TokenService } from './token.service';

const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const MAX_OTP_VERIFY_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    @Inject(SMS_PROVIDER_TOKEN) private readonly smsProvider: SmsProvider,
  ) {}

  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  async requestPhoneOtp(dto: RequestOtpDto): Promise<OtpRequestResponse> {
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
    const windowStart = new Date(
      Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    const recentRequestsCount = await this.prisma.otpChallenge.count({
      where: {
        phoneNumber,
        createdAt: { gte: windowStart },
      },
    });

    if (recentRequestsCount >= MAX_OTP_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        `Too many OTP requests for ${phoneNumber}. Please wait ${OTP_RATE_LIMIT_WINDOW_MINUTES} minutes before trying again.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otpCode = this.tokenService.generateNumericOtp();
    const codeHash = this.tokenService.hashValue(otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpChallenge.create({
      data: {
        phoneNumber,
        codeHash,
        expiresAt,
      },
    });

    await this.smsProvider.sendOtp(phoneNumber, otpCode, OTP_EXPIRY_MINUTES);

    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    return {
      message: `A 6-digit verification code has been sent to ${phoneNumber}.`,
      phoneNumber,
      expiresAt: expiresAt.toISOString(),
      ...(nodeEnv !== 'production' ? { devOtpPreview: otpCode } : {}),
    };
  }

  async verifyPhoneOtpAndSignIn(
    dto: VerifyOtpDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthSessionResponse> {
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);

    await this.verifyAndConsumeOtpChallenge(phoneNumber, dto.code);

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: { profile: true },
    });

    if (!user) {
      const generatedUsername = await this.generateUniqueUsername(
        dto.displayName ?? `rider_${phoneNumber.slice(-4)}`,
      );
      const displayName = dto.displayName?.trim() || `Rider ${phoneNumber.slice(-4)}`;

      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          role: UserRole.USER,
          accountStatus: AccountStatus.ACTIVE,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: generatedUsername,
              displayName,
              bio: 'RidersClub member',
            },
          },
        },
        include: { profile: true },
      });
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        `Cannot sign in: account is currently ${user.accountStatus}.`,
      );
    }

    return this.createSessionForUser(this.mapUserToAccountDto(user), meta);
  }

  async signInWithGoogle(
    dto: GoogleSignInDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthSessionResponse> {
    let verifiedSub = dto.googleSubjectId?.trim() ?? '';
    let verifiedEmail = dto.email?.trim().toLowerCase() ?? '';
    let verifiedDisplayName = dto.displayName?.trim() ?? '';
    let verifiedAvatarUrl = dto.avatarUrl?.trim() || null;

    if (dto.googleAccessToken) {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${dto.googleAccessToken.trim()}`,
        },
      });
      if (!userInfoRes.ok) {
        throw new UnauthorizedException(
          'Google OAuth verification failed: invalid or expired Google access token.',
        );
      }
      const userInfo = (await userInfoRes.json()) as {
        sub?: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
      };
      if (!userInfo.sub || !userInfo.email || userInfo.email_verified === false) {
        throw new UnauthorizedException(
          'Google OAuth verification failed: Google account email is not verified.',
        );
      }
      verifiedSub = userInfo.sub;
      verifiedEmail = userInfo.email.trim().toLowerCase();
      verifiedDisplayName = userInfo.name?.trim() || verifiedEmail.split('@')[0] || 'Rider';
      verifiedAvatarUrl = userInfo.picture?.trim() || null;
    } else if (dto.googleIdToken) {
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.googleIdToken.trim())}`,
      );
      if (!tokenInfoRes.ok) {
        throw new UnauthorizedException(
          'Google OAuth verification failed: invalid or expired Google ID token.',
        );
      }
      const tokenInfo = (await tokenInfoRes.json()) as {
        sub?: string;
        email?: string;
        email_verified?: string | boolean;
        name?: string;
        picture?: string;
      };
      if (
        !tokenInfo.sub ||
        !tokenInfo.email ||
        (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true)
      ) {
        throw new UnauthorizedException(
          'Google OAuth verification failed: Google account email is not verified.',
        );
      }
      verifiedSub = tokenInfo.sub;
      verifiedEmail = tokenInfo.email.trim().toLowerCase();
      verifiedDisplayName = tokenInfo.name?.trim() || verifiedEmail.split('@')[0] || 'Rider';
      verifiedAvatarUrl = tokenInfo.picture?.trim() || null;
    } else {
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv !== 'test') {
        throw new UnauthorizedException(
          'Please sign in using the official Google account selection popup.',
        );
      }
      if (!verifiedSub || !verifiedEmail || !verifiedDisplayName) {
        throw new BadRequestException('Missing Google OAuth identity fields.');
      }
    }

    const normalizedEmail = verifiedEmail;
    const googleSubjectId = verifiedSub;
    const adminEmailsRaw = this.configService.get<string>(
      'ADMIN_EMAILS',
      'dhivyalvv@gmail.com,admin@ridersclub.dev,admin.governance@ridersclub.example',
    );
    const adminEmailSet = new Set(
      adminEmailsRaw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
    const isDesignatedAdminEmail = adminEmailSet.has(normalizedEmail);

    try {
      // 1. Check if a user already exists with this exact Google Subject ID
      let user = await this.prisma.user.findUnique({
        where: { googleSubjectId },
        include: { profile: true },
      });

      if (!user) {
        // 2. Account-linking safeguard: Check if an account exists with the same verified email
        const existingEmailUser = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { profile: true },
        });

        if (existingEmailUser) {
          if (
            existingEmailUser.googleSubjectId &&
            existingEmailUser.googleSubjectId !== googleSubjectId &&
            !dto.googleAccessToken &&
            !dto.googleIdToken
          ) {
            throw new ConflictException(
              'This email is already linked to a different Google identity.',
            );
          }

          user = await this.prisma.user.update({
            where: { id: existingEmailUser.id },
            data: {
              googleSubjectId,
              ...(isDesignatedAdminEmail ? { role: UserRole.ADMIN } : {}),
              ...(!existingEmailUser.profile
                ? {
                    profile: {
                      create: {
                        username: await this.generateUniqueUsername(verifiedDisplayName),
                        displayName: verifiedDisplayName,
                        avatarUrl: verifiedAvatarUrl,
                        bio: isDesignatedAdminEmail
                          ? 'RidersClub Platform Administrator'
                          : 'RidersClub member',
                      },
                    },
                  }
                : {}),
            },
            include: { profile: true },
          });
        } else {
          const generatedUsername = await this.generateUniqueUsername(verifiedDisplayName);

          user = await this.prisma.user.create({
            data: {
              email: normalizedEmail,
              googleSubjectId,
              role: isDesignatedAdminEmail ? UserRole.ADMIN : UserRole.USER,
              accountStatus: AccountStatus.ACTIVE,
              allowDirectMessages: DirectMessagePrivacy.EVERYONE,
              profile: {
                create: {
                  username: generatedUsername,
                  displayName: verifiedDisplayName,
                  avatarUrl: verifiedAvatarUrl,
                  bio: isDesignatedAdminEmail
                    ? 'RidersClub Platform Administrator'
                    : 'RidersClub member',
                },
              },
            },
            include: { profile: true },
          });
        }
      } else if (isDesignatedAdminEmail && user.role !== UserRole.ADMIN) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN },
          include: { profile: true },
        });
      }

      if (user.accountStatus !== AccountStatus.ACTIVE) {
        throw new ForbiddenException(
          `Cannot sign in: account is currently ${user.accountStatus}.`,
        );
      }

      return await this.createSessionForUser(this.mapUserToAccountDto(user), meta);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const rawMessage = err instanceof Error ? err.message : String(err);
      if (rawMessage.includes("Can't reach database server")) {
        throw new HttpException(
          'PostgreSQL database is not running on localhost:5432. Please start Docker Desktop (docker compose up -d postgres redis) and try again.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        `Google sign-in database error: ${rawMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async linkPhoneToAccount(
    userId: string,
    dto: LinkPhoneDto,
  ): Promise<AuthenticatedUserAccount> {
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);

    const existingOwner = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingOwner && existingOwner.id !== userId) {
      throw new ConflictException(
        'This phone number is already linked to another RidersClub account.',
      );
    }

    await this.verifyAndConsumeOtpChallenge(phoneNumber, dto.code);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { phoneNumber },
      include: { profile: true },
    });

    return this.mapUserToAccountDto(updated);
  }

  async validateSessionAndGetUser(
    userId: string,
    sessionId: string,
  ): Promise<AuthenticatedUserAccount> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Session is invalid or has been signed out.');
    }

    return this.mapUserToAccountDto(session.user);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async verifyAndConsumeOtpChallenge(
    phoneNumber: string,
    code: string,
  ): Promise<void> {
    const latestChallenge = await this.prisma.otpChallenge.findFirst({
      where: {
        phoneNumber,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestChallenge) {
      throw new BadRequestException(
        'No active OTP verification request found for this phone number.',
      );
    }

    if (latestChallenge.expiresAt <= new Date()) {
      throw new BadRequestException(
        'This OTP code has expired. Please request a new code.',
      );
    }

    if (latestChallenge.attempts >= MAX_OTP_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Maximum OTP verification attempts exceeded. Please request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isMatch = this.tokenService.verifyHash(code, latestChallenge.codeHash);
    if (!isMatch) {
      await this.prisma.otpChallenge.update({
        where: { id: latestChallenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP verification code.');
    }

    await this.prisma.otpChallenge.update({
      where: { id: latestChallenge.id },
      data: { consumedAt: new Date() },
    });
  }

  private async createSessionForUser(
    account: AuthenticatedUserAccount,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthSessionResponse> {
    const sessionId = randomUUID();
    const { token, expiresAt } = this.tokenService.signAccessToken({
      userId: account.id,
      role: account.role,
      sessionId,
    });

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: account.id,
        tokenHash: this.tokenService.hashValue(token),
        userAgent: meta?.userAgent?.slice(0, 255) ?? null,
        ipAddress: meta?.ipAddress ?? null,
        expiresAt,
      },
    });

    return {
      accessToken: token,
      expiresAt: expiresAt.toISOString(),
      user: account,
    };
  }

  private async generateUniqueUsername(seed: string): Promise<string> {
    const base =
      seed
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 20) || 'rider';

    const existing = await this.prisma.userProfile.findUnique({
      where: { username: base },
    });

    if (!existing) {
      return base;
    }

    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${base}_${suffix}`;
  }

  mapUserToAccountDto(user: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    googleSubjectId: string | null;
    role: string;
    accountStatus: string;
    allowDirectMessages: string;
    profile: {
      id: string;
      userId: string;
      username: string;
      displayName: string;
      bio: string | null;
      avatarUrl: string | null;
      city: string | null;
      showPhone: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): AuthenticatedUserAccount {
    if (!user.profile) {
      throw new BadRequestException('User profile record is missing.');
    }

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      hasGoogleLinked: Boolean(user.googleSubjectId),
      role: user.role as UserRole,
      accountStatus: user.accountStatus as AccountStatus,
      allowDirectMessages: user.allowDirectMessages as DirectMessagePrivacy,
      profile: {
        id: user.profile.id,
        userId: user.profile.userId,
        username: user.profile.username,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        avatarUrl: user.profile.avatarUrl,
        city: user.profile.city,
        showPhone: user.profile.showPhone,
        createdAt: user.profile.createdAt.toISOString(),
        updatedAt: user.profile.updatedAt.toISOString(),
      },
    };
  }
}

