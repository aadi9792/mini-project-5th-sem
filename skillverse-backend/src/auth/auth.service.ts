import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SignUpDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(plainToken: string): string {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
  }

  private hashRefreshToken(token: string): string {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret';
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
  }

  async signup(dto: SignUpDto) {
    const email = dto.email.trim().toLowerCase();

    // Check existing
    const existing = await this.prisma.guardian.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.emailVerified) {
        throw new ConflictException('An account with this email already exists.');
      }
      // Re-signup with unverified email: resend verification token
      await this.issueAndSendVerificationToken(existing.id, existing.email, existing.name);
      return { message: 'Verification email sent. Please check your inbox.' };
    }

    // Required consent checks
    if (!dto.confirmedGuardianStatus || !dto.dataStorageConsent || !dto.nonMedicalDeviceAck) {
      throw new BadRequestException('All mandatory consent checkboxes must be accepted.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const guardian = await this.prisma.guardian.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        emailVerified: false,
      },
    });

    // Record consent
    await this.prisma.consentRecord.create({
      data: {
        guardianId: guardian.id,
        confirmedGuardianStatus: dto.confirmedGuardianStatus,
        dataStorageConsent: dto.dataStorageConsent,
        nonMedicalDeviceAck: dto.nonMedicalDeviceAck,
        marketingOptIn: dto.marketingOptIn ?? false,
        consentTextVersion: 'v1',
      },
    });

    const plainToken = await this.issueAndSendVerificationToken(guardian.id, guardian.email, guardian.name);

    const hasResend = !!this.config.get<string>('RESEND_API_KEY');

    return {
      message: 'Account created. Please check your email to verify your account.',
      devVerificationToken: !hasResend ? plainToken : undefined,
      guardian: {
        id: guardian.id,
        email: guardian.email,
        name: guardian.name,
      },
    };
  }

  private async issueAndSendVerificationToken(guardianId: string, email: string, name: string): Promise<string> {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: {
        guardianId,
        tokenHash,
        expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(email, name, plainToken);
    return plainToken;
  }

  async verifyEmail(plainToken: string) {
    if (!plainToken) {
      throw new BadRequestException('Token is required.');
    }

    const tokenHash = this.hashToken(plainToken);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This verification link is invalid or has expired.');
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await this.prisma.guardian.update({
      where: { id: record.guardianId },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.trim().toLowerCase();
    const guardian = await this.prisma.guardian.findUnique({ where: { email } });

    let devToken: string | undefined;
    if (guardian && !guardian.emailVerified) {
      devToken = await this.issueAndSendVerificationToken(guardian.id, guardian.email, guardian.name);
    }

    const hasResend = !!this.config.get<string>('RESEND_API_KEY');

    return {
      message: 'If an unverified account exists for this email, a verification link has been sent.',
      devVerificationToken: !hasResend ? devToken : undefined,
    };
  }

  async login(dto: LoginDto, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    const guardian = await this.prisma.guardian.findUnique({ where: { email } });

    if (!guardian) {
      throw new UnauthorizedException('Incorrect email or password.');
    }

    // Check account lockout
    if (guardian.lockedUntil && guardian.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((guardian.lockedUntil.getTime() - Date.now()) / 1000);
      throw new ForbiddenException({
        message: 'Account temporarily locked. Please wait before trying again.',
        lockedUntil: guardian.lockedUntil,
        remainingSeconds,
      });
    }

    if (!guardian.passwordHash) {
      throw new UnauthorizedException('Please sign in using Google.');
    }

    const isMatch = await bcrypt.compare(dto.password, guardian.passwordHash);
    if (!isMatch) {
      const attempts = guardian.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 60 * 1000); // 60s lockout
      }

      await this.prisma.guardian.update({
        where: { id: guardian.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      if (lockedUntil) {
        throw new ForbiddenException({
          message: 'Account temporarily locked due to 5 failed attempts. Please wait 60 seconds.',
          lockedUntil,
          remainingSeconds: 60,
        });
      }

      throw new UnauthorizedException('Incorrect email or password.');
    }

    if (!guardian.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    // Reset failed login attempts on successful login
    await this.prisma.guardian.update({
      where: { id: guardian.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const tokens = await this.generateTokens(guardian.id, guardian.email, userAgent, dto.rememberMe);

    return {
      guardian: {
        id: guardian.id,
        email: guardian.email,
        name: guardian.name,
      },
      ...tokens,
      rememberMe: dto.rememberMe ?? false,
    };
  }

  private async generateTokens(guardianId: string, email: string, userAgent?: string, rememberMe?: boolean) {
    const payload = { sub: guardianId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '7d',
    });

    // Refresh token: 48 random bytes hex
    const plainRefreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashRefreshToken(plainRefreshToken);
    const maxAgeDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        guardianId,
        tokenHash,
        deviceLabel: userAgent ? userAgent.substring(0, 100) : null,
        expiresAt,
      },
    });

    return {
      accessToken,
      plainRefreshToken,
      rememberMe: !!rememberMe,
    };
  }

  async refresh(plainRefreshToken: string, userAgent?: string) {
    if (!plainRefreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    const tokenHash = this.hashRefreshToken(plainRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Check if token was already revoked: possible replay attack
    if (existing.revokedAt) {
      // Revoke all tokens for this guardian
      await this.prisma.refreshToken.updateMany({
        where: { guardianId: existing.guardianId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token replay detected. All sessions invalidated.');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired.');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const guardian = await this.prisma.guardian.findUnique({
      where: { id: existing.guardianId },
    });

    if (!guardian) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.generateTokens(guardian.id, guardian.email, userAgent, false);
  }

  async logout(plainRefreshToken?: string) {
    if (plainRefreshToken) {
      const tokenHash = this.hashRefreshToken(plainRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const guardian = await this.prisma.guardian.findUnique({ where: { email } });

    // Always respond with the same message to prevent account enumeration
    if (guardian) {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(plainToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          guardianId: guardian.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.mailService.sendPasswordResetEmail(guardian.email, guardian.name, plainToken);
    }

    return { message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await this.prisma.guardian.update({
      where: { id: record.guardianId },
      data: { passwordHash },
    });

    // Invalidate all active refresh tokens for this guardian
    await this.prisma.refreshToken.updateMany({
      where: { guardianId: record.guardianId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  async getMe(guardianId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!guardian) {
      throw new UnauthorizedException('Guardian not found.');
    }

    return guardian;
  }
}
