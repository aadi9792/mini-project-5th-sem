import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ScreenTimeService } from './screen-time.service';

@Controller('screen-time')
@UseGuards(AuthGuard)
export class ScreenTimeController {
  constructor(private readonly screenTimeService: ScreenTimeService) {}

  @Get()
  async getScreenTime(@Req() req: any) {
    return this.screenTimeService.getScreenTime(req.user.id);
  }

  @Patch()
  async updateSettings(@Req() req: any, @Body() body: any) {
    return this.screenTimeService.updateSettings(req.user.id, body);
  }
}

