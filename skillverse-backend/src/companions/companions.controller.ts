import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CompanionsService } from './companions.service';
import type { Request } from 'express';

@Controller('companions')
@UseGuards(AuthGuard)
export class CompanionsController {
  constructor(private readonly companionsService: CompanionsService) {}

  @Get('catalog')
  async getCatalog(@Req() req: Request) {
    const guardianId = (req as any).user.sub;
    return this.companionsService.getCatalog(guardianId);
  }

  @Post('adopt')
  @HttpCode(HttpStatus.CREATED)
  async adopt(
    @Req() req: Request,
    @Body('speciesId') speciesId: string,
    @Body('customName') customName: string,
  ) {
    const guardianId = (req as any).user.sub;
    return this.companionsService.adoptCompanion(guardianId, speciesId, customName);
  }

  @Patch(':id/rename')
  async rename(
    @Req() req: Request,
    @Param('id') companionId: string,
    @Body('customName') customName: string,
  ) {
    const guardianId = (req as any).user.sub;
    return this.companionsService.renameCompanion(guardianId, companionId, customName);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Req() req: Request, @Param('id') companionId: string) {
    const guardianId = (req as any).user.sub;
    return this.companionsService.activateCompanion(guardianId, companionId);
  }

  @Get('me')
  async getMyCompanions(@Req() req: Request) {
    const guardianId = (req as any).user.sub;
    return this.companionsService.getMyCompanions(guardianId);
  }
}

