import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScreenTimeController } from './screen-time.controller';
import { ScreenTimeService } from './screen-time.service';

@Module({
  imports: [PrismaModule],
  controllers: [ScreenTimeController],
  providers: [ScreenTimeService],
})
export class ScreenTimeModule {}

