import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { EconomyService } from './economy.service';

@Controller('economy')
@UseGuards(AuthGuard)
export class EconomyController {
  constructor(private readonly economyService: EconomyService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    return this.economyService.getSummary(req.user.id);
  }

  @Get('shop')
  async getShop(@Req() req: any) {
    return this.economyService.getShop(req.user.id);
  }

  @Post('shop/buy')
  async buyItem(@Req() req: any, @Body('itemId') itemId: string) {
    return this.economyService.buyItem(req.user.id, itemId);
  }

  @Post('shop/equip')
  async equipItem(@Req() req: any, @Body('itemId') itemId: string) {
    return this.economyService.equipItem(req.user.id, itemId);
  }

  @Post('shop/unequip')
  async unequipItem(@Req() req: any, @Body('itemId') itemId: string) {
    return this.economyService.unequipItem(req.user.id, itemId);
  }

  @Post('avatar/face')
  async setAvatarFace(@Req() req: any, @Body('face') face: string) {
    return this.economyService.setAvatarFace(req.user.id, face);
  }

  @Get('wins')
  async getWins(@Req() req: any) {
    return this.economyService.getWins(req.user.id);
  }

  @Post('quest-complete')
  async recordQuestCompletion(@Req() req: any, @Body() body: any) {
    return this.economyService.recordQuestCompletion(req.user.id, body);
  }
}

