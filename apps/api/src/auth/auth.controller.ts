import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type {
  AuthenticatedUserAccount,
  AuthSessionResponse,
  OtpRequestResponse,
} from '@ridersclub/types';
import { AuthService } from './auth.service';
import {
  GoogleSignInDto,
  LinkPhoneDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  type AuthenticatedRequest,
} from './guards/jwt-auth.guard';

@ApiTags('Authentication & Sessions')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a 6-digit phone OTP with expiration and rate limiting',
  })
  @ApiResponse({ status: 200, description: 'OTP challenge created and sent' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded for phone number' })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<OtpRequestResponse> {
    return this.authService.requestPhoneOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone OTP code and establish session' })
  @ApiResponse({ status: 200, description: 'Authenticated session established' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const session = await this.authService.verifyPhoneOtpAndSignIn(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    this.attachSessionCookie(res, session.accessToken, session.expiresAt);
    return session;
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in or register using Google OAuth with account-linking safeguards',
  })
  @ApiResponse({ status: 200, description: 'Authenticated session established' })
  async googleSignIn(
    @Body() dto: GoogleSignInDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResponse> {
    const session = await this.authService.signInWithGoogle(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    this.attachSessionCookie(res, session.accessToken, session.expiresAt);
    return session;
  }

  @Post('link/phone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Link a verified phone number to the currently authenticated account',
  })
  async linkPhone(
    @CurrentUser() user: AuthenticatedUserAccount,
    @Body() dto: LinkPhoneDto,
  ): Promise<AuthenticatedUserAccount> {
    return this.authService.linkPhoneToAccount(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user account and profile' })
  async getMe(
    @CurrentUser() user: AuthenticatedUserAccount,
  ): Promise<AuthenticatedUserAccount> {
    return user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active session and clear authentication cookie' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    if (req.sessionId) {
      await this.authService.revokeSession(req.sessionId);
    }

    res.clearCookie('rc_access_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Signed out successfully.' };
  }

  private attachSessionCookie(
    res: Response,
    token: string,
    expiresAtIso: string,
  ): void {
    res.cookie('rc_access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(expiresAtIso),
      path: '/',
    });
  }
}

