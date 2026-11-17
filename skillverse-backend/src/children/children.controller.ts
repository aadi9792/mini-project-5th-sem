import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ChildrenService } from './children.service';
import { PreferencesService } from './preferences.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildProfileDto } from './dto/update-child-profile.dto';
import { CreatePreferencesDto, UpdatePreferencesDto } from './dto/preferences.dto';
import type { Request } from 'express';

@Controller('children')
@UseGuards(AuthGuard)
export class ChildrenController {
  constructor(
    private readonly childrenService: ChildrenService,
    private readonly preferencesService: PreferencesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChild(@Req() req: Request, @Body() dto: CreateChildDto) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.createChild(guardianId, dto);
  }

  @Get('me')
  async getMyChild(@Req() req: Request) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.getMyChild(guardianId);
  }

  @Patch(':id/profile')
  async updateProfile(
    @Req() req: Request,
    @Param('id') childId: string,
    @Body() dto: UpdateChildProfileDto,
  ) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.updateProfile(guardianId, childId, dto);
  }

  @Post(':id/preferences')
  @HttpCode(HttpStatus.CREATED)
  async createPreferences(
    @Req() req: Request,
    @Param('id') childId: string,
    @Body() dto: CreatePreferencesDto,
  ) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.createPreferences(guardianId, childId, dto);
  }

  @Patch(':id/preferences')
  async updatePreferences(
    @Req() req: Request,
    @Param('id') childId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.updatePreferences(guardianId, childId, dto);
  }

  @Get(':id/preferences/derived')
  async getDerivedPreferences(@Param('id') childId: string) {
    return this.preferencesService.getDerivedPreferences(childId);
  }

  @Patch(':id/theme')
  async updateTheme(
    @Req() req: Request,
    @Param('id') childId: string,
    @Body('theme') theme: string,
  ) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.updateTheme(guardianId, childId, theme);
  }

  @Post(':id/complete-tutorial')
  @HttpCode(HttpStatus.OK)
  async completeTutorial(@Req() req: Request, @Param('id') childId: string) {
    const guardianId = (req as any).user.sub;
    return this.childrenService.completeTutorial(guardianId, childId);
  }
}

