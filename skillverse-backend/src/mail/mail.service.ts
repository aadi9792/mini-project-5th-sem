import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is not set. Transactional emails will be logged to console in dev mode.');
    }
  }

  async sendVerificationEmail(email: string, name: string, plainToken: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/verify-email?token=${plainToken}`;

    const subject = 'Verify your Skillverse account';
    const text = `Hi ${name}, click the link below to verify your email and finish setting up your Skillverse account. This link expires in 24 hours and can only be used once.\n\nVerify My Email: ${link}`;

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject,
          text,
        });
        this.logger.log(`Verification email sent to ${email}`);
      } catch (err: any) {
        this.logger.error(`Failed to send verification email via Resend: ${err?.message || err}`, err?.stack);
      }
    } else {
      this.logger.log(`[DEV EMAIL SIMULATION] To: ${email} | Subject: "${subject}"\nLink: ${link}`);
    }
  }

  async sendPasswordResetEmail(email: string, name: string, plainToken: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/reset-password?token=${plainToken}`;

    const subject = 'Reset your Skillverse password';
    const text = `Hi ${name}, click the link below to choose a new password for your Skillverse account. This link expires in 1 hour and can only be used once.\n\nReset My Password: ${link}`;

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject,
          text,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } catch (err: any) {
        this.logger.error(`Failed to send password reset email via Resend: ${err?.message || err}`, err?.stack);
      }
    } else {
      this.logger.log(`[DEV EMAIL SIMULATION] To: ${email} | Subject: "${subject}"\nLink: ${link}`);
    }
  }
}
