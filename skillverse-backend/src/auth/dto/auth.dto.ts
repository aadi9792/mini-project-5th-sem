import { IsEmail, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  confirmPassword?: string;

  @IsBoolean()
  confirmedGuardianStatus: boolean;

  @IsBoolean()
  dataStorageConsent: boolean;

  @IsBoolean()
  nonMedicalDeviceAck: boolean;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @MinLength(8)
  newPassword: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}
