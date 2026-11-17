import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [GuardiansController],
  providers: [GuardiansService],
})
export class GuardiansModule {}

