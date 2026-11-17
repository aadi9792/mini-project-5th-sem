import { Module } from '@nestjs/common';
import { CompanionsController } from './companions.controller';
import { CompanionsService } from './companions.service';
import { NamingFilterService } from './naming-filter.service';
import { ZoneCheckInsController } from './zone-checkins/zone-checkins.controller';
import { ZoneCheckInsService } from './zone-checkins/zone-checkins.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CompanionsController, ZoneCheckInsController],
  providers: [CompanionsService, NamingFilterService, ZoneCheckInsService],
  exports: [CompanionsService, ZoneCheckInsService],
})
export class CompanionsModule {}

