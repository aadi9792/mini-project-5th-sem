import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { JourneyService } from './journey.service';

@Controller('journey')
@UseGuards(AuthGuard)
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Get('templates')
  async getTemplates() {
    return this.journeyService.getTemplates();
  }

  @Get(':date')
  async getQuestsForDate(@Req() req: any, @Param('date') date: string) {
    return this.journeyService.getQuestsForDate(req.user.id, date);
  }

  @Post('quests')
  @HttpCode(HttpStatus.CREATED)
  async createQuest(@Req() req: any, @Body() body: any) {
    return this.journeyService.createQuest(req.user.id, body);
  }

  @Patch('quests/:id')
  async updateQuest(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.journeyService.updateQuest(req.user.id, id, body);
  }

  @Delete('quests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuest(@Req() req: any, @Param('id') id: string) {
    return this.journeyService.deleteQuest(req.user.id, id);
  }

  @Patch('reorder')
  async reorderQuests(@Req() req: any, @Body() body: { date: string; orderedQuestIds: string[] }) {
    return this.journeyService.reorderQuests(req.user.id, body);
  }

  @Post('repeat-yesterday')
  @HttpCode(HttpStatus.CREATED)
  async repeatYesterday(@Req() req: any, @Body('forDate') forDate: string) {
    return this.journeyService.repeatYesterday(req.user.id, forDate);
  }
}

