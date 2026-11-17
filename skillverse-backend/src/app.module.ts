import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { CompanionsModule } from './companions/companions.module';
import { EconomyModule } from './economy/economy.module';
import { JourneyModule } from './journey/journey.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlaySessionsModule } from './play-sessions/play-sessions.module';
import { ScreenTimeModule } from './screen-time/screen-time.module';
import { GuardiansModule } from './guardians/guardians.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    ChildrenModule,
    CompanionsModule,
    EconomyModule,
    JourneyModule,
    DashboardModule,
    PlaySessionsModule,
    ScreenTimeModule,
    GuardiansModule,
  ],
})
export class AppModule {}
