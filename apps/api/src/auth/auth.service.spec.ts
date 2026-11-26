import { ConflictException, HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatus, DirectMessagePrivacy, UserRole } from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { SMS_PROVIDER_TOKEN } from './sms.provider';
import { TokenService } from './token.service';

describe('AuthService (OTP expiration, rate limiting & account-linking safeguards)', () => {
  let authService: AuthService;
  let tokenService: TokenService;

  const mockPrisma = {
    otpChallenge: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockSmsProvider = {
    sendOtp: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal: string) =>
              key === 'NODE_ENV' ? 'test' : defaultVal,
            ),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SMS_PROVIDER_TOKEN,
          useValue: mockSmsProvider,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('enforces rate limiting when requesting more than 3 OTPs within 10 minutes', async () => {
    mockPrisma.otpChallenge.count.mockResolvedValueOnce(3);

    await expect(
      authService.requestPhoneOtp({ phoneNumber: '+919845012345' }),
    ).rejects.toThrow(HttpException);
  });

  it('hashes OTP before saving and verifies valid non-expired OTP to create session', async () => {
    mockPrisma.otpChallenge.count.mockResolvedValueOnce(0);
    mockPrisma.otpChallenge.create.mockResolvedValueOnce({ id: 'otp-1' });

    const otpResponse = await authService.requestPhoneOtp({
      phoneNumber: '+919845012345',
    });

    expect(otpResponse.devOtpPreview).toMatch(/^\d{6}$/);
    expect(mockSmsProvider.sendOtp).toHaveBeenCalledTimes(1);

    const codeHash = tokenService.hashValue(otpResponse.devOtpPreview!);
    mockPrisma.otpChallenge.findFirst.mockResolvedValueOnce({
      id: 'otp-1',
      phoneNumber: '+919845012345',
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 300_000),
      consumedAt: null,
    });
    mockPrisma.otpChallenge.update.mockResolvedValueOnce({});

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: null,
      phoneNumber: '+919845012345',
      googleSubjectId: null,
      role: UserRole.USER,
      accountStatus: AccountStatus.ACTIVE,
      allowDirectMessages: DirectMessagePrivacy.EVERYONE,
      profile: {
        id: 'prof-1',
        userId: 'user-1',
        username: 'aarav_rides',
        displayName: 'Aarav Sharma',
        bio: 'Tourer',
        avatarUrl: null,
        city: 'Bengaluru',
        showPhone: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    mockPrisma.userSession.create.mockResolvedValueOnce({ id: 'sess-1' });

    const session = await authService.verifyPhoneOtpAndSignIn({
      phoneNumber: '+919845012345',
      code: otpResponse.devOtpPreview!,
    });

    expect(session.accessToken).toBeTruthy();
    expect(session.user.profile.username).toBe('aarav_rides');
  });

  it('increments attempts and rejects wrong OTP codes', async () => {
    mockPrisma.otpChallenge.findFirst.mockResolvedValueOnce({
      id: 'otp-2',
      phoneNumber: '+919845012345',
      codeHash: tokenService.hashValue('111111'),
      attempts: 0,
      expiresAt: new Date(Date.now() + 300_000),
      consumedAt: null,
    });

    await expect(
      authService.verifyPhoneOtpAndSignIn({
        phoneNumber: '+919845012345',
        code: '999999',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrisma.otpChallenge.update).toHaveBeenCalledWith({
      where: { id: 'otp-2' },
      data: { attempts: { increment: 1 } },
    });
  });

  it('prevents Google account linking hijack if email is bound to another Google Subject ID', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // lookup by googleSubjectId
      .mockResolvedValueOnce({
        id: 'user-existing',
        email: 'rider@ridersclub.dev',
        googleSubjectId: 'original-google-sub-111',
      });

    await expect(
      authService.signInWithGoogle({
        googleSubjectId: 'attacker-google-sub-999',
        email: 'rider@ridersclub.dev',
        displayName: 'Rider',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('registers a new rider via signUpWithPassword and signs in via signInWithPassword', async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const passwordHash = tokenService.hashPassword('SecretPass123!');

    const createdUserRecord = {
      id: 'user-pw-1',
      email: 'karthik@ridersclub.dev',
      phoneNumber: null,
      googleSubjectId: null,
      passwordHash,
      role: UserRole.USER,
      accountStatus: AccountStatus.ACTIVE,
      allowDirectMessages: DirectMessagePrivacy.EVERYONE,
      profile: {
        id: 'prof-pw-1',
        userId: 'user-pw-1',
        username: 'karthik_rc',
        displayName: 'Karthik R',
        bio: 'RidersClub member',
        avatarUrl: null,
        city: null,
        showPhone: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    mockPrisma.user.create.mockResolvedValueOnce(createdUserRecord);
    mockPrisma.userSession.create.mockResolvedValueOnce({ id: 'sess-pw-1' });

    const signUpSession = await authService.signUpWithPassword({
      username: 'karthik_rc',
      password: 'SecretPass123!',
      displayName: 'Karthik R',
      email: 'karthik@ridersclub.dev',
    });

    expect(signUpSession.accessToken).toBeTruthy();
    expect(signUpSession.user.profile.username).toBe('karthik_rc');

    // Now test signInWithPassword by username
    mockPrisma.userProfile.findUnique.mockResolvedValueOnce({
      ...createdUserRecord.profile,
      user: createdUserRecord,
    });
    mockPrisma.userSession.create.mockResolvedValueOnce({ id: 'sess-pw-2' });

    const signInSession = await authService.signInWithPassword({
      identifier: 'karthik_rc',
      password: 'SecretPass123!',
    });

    expect(signInSession.accessToken).toBeTruthy();
    expect(signInSession.user.id).toBe('user-pw-1');

    // Reject wrong password
    mockPrisma.userProfile.findUnique.mockResolvedValueOnce({
      ...createdUserRecord.profile,
      user: createdUserRecord,
    });

    await expect(
      authService.signInWithPassword({
        identifier: 'karthik_rc',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

