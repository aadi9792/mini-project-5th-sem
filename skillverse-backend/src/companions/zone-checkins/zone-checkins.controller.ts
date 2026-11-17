import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ZoneCheckInsService } from './zone-checkins.service';
import type { Request } from 'express';

@Controller('zone-checkins')
@UseGuards(AuthGuard)
export class ZoneCheckInsController {
  constructor(private readonly zoneCheckInsService: ZoneCheckInsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recordCheckIn(@Req() req: Request, @Body('zone') zone: string) {
    const guardianId = (req as any).user.sub;
    return this.zoneCheckInsService.recordCheckIn(guardianId, zone);
  }
}

