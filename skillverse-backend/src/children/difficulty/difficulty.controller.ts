import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { DifficultyService } from './difficulty.service';

@Controller('difficulty')
@UseGuards(AuthGuard)
export class DifficultyController {
  constructor(private readonly difficultyService: DifficultyService) {}

  @Get(':gameId')
  async getProfile(@Req() req: any, @Param('gameId') gameId: string) {
    return this.difficultyService.getProfile(req.user.id, gameId);
  }

  @Patch(':gameId')
  async upsertProfile(
    @Req() req: any,
    @Param('gameId') gameId: string,
    @Body('tier') tier: 'easy' | 'medium' | 'hard',
  ) {
    return this.difficultyService.upsertProfile(req.user.id, gameId, tier);
  }

  @Get('')
  async getAllProfiles(@Req() req: any) {
    return this.difficultyService.getAllProfiles(req.user.id);
  }
}

