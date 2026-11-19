import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto } from './dto/auth.dto';
import { AuthGuard } from './auth.guard';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string, rememberMe: boolean) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    // sv_access_token (7 days in dev)
    res.cookie('sv_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // sv_refresh_token (30 days if rememberMe, session cookie if not)
    const refreshCookieOptions: any = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    };

    if (rememberMe) {
      refreshCookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie('sv_refresh_token', refreshToken, refreshCookieOptions);
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.clearCookie('sv_access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('sv_refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmailPost(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, userAgent);

    this.setAuthCookies(res, result.accessToken, result.plainRefreshToken, result.rememberMe);

    return {
      message: 'Logged in successfully.',
      guardian: result.guardian,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['sv_refresh_token'];
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refresh(refreshToken, userAgent);
    this.setAuthCookies(res, result.accessToken, result.plainRefreshToken, result.rememberMe);

    return { message: 'Token refreshed successfully.' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['sv_refresh_token'];
    await this.authService.logout(refreshToken);
    this.clearAuthCookies(res);

    return { message: 'Logged out successfully.' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.getMe(user.sub);
  }
}
