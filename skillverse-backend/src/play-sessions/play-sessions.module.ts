import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlaySessionsController } from './play-sessions.controller';
import { PlaySessionsService } from './play-sessions.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlaySessionsController],
  providers: [PlaySessionsService],
})
export class PlaySessionsModule {}

