import { Controller, Post, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PlaySessionsService } from './play-sessions.service';

@Controller('play-sessions')
@UseGuards(AuthGuard)
export class PlaySessionsController {
  constructor(private readonly playSessionsService: PlaySessionsService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startSession(@Req() req: any) {
    return this.playSessionsService.startSession(req.user.id);
  }

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Param('id') id: string) {
    return this.playSessionsService.heartbeat(id);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  async endSession(@Param('id') id: string) {
    return this.playSessionsService.endSession(id);
  }
}

