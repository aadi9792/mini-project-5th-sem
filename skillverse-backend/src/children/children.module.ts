import { Module } from '@nestjs/common';
import { ChildrenController } from './children.controller';
import { ChildrenService } from './children.service';
import { PreferencesService } from './preferences.service';
import { DifficultyController } from './difficulty/difficulty.controller';
import { DifficultyService } from './difficulty/difficulty.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ChildrenController, DifficultyController],
  providers: [ChildrenService, PreferencesService, DifficultyService],
  exports: [ChildrenService, PreferencesService, DifficultyService],
})
export class ChildrenModule {}

