import { Controller, Get, Delete, Post, Body, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GuardiansService } from './guardians.service';
import type { Response } from 'express';

@Controller('guardian')
@UseGuards(AuthGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(
    @Req() req: any,
    @Body('password') password: string,
    @Body('intent') intent: 'view' | 'action',
  ) {
    const guardianId = req.user?.sub ?? req.user?.id;
    return this.guardiansService.verifyPassword(guardianId, password, intent);
  }

  @Get('export')
  async exportData(@Req() req: any, @Res() res: Response) {
    const guardianId = req.user?.sub ?? req.user?.id;
    const data = await this.guardiansService.exportData(guardianId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="skillverse-export.json"');
    res.send(JSON.stringify(data, null, 2));
  }

  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body('confirmationPhrase') confirmationPhrase: string,
  ) {
    const guardianId = req.user?.sub ?? req.user?.id;
    const result = await this.guardiansService.deleteAccount(guardianId, confirmationPhrase);
    if ((result as any).error) {
      res.status(400).json(result);
      return;
    }
    // Clear session cookies
    res.clearCookie('sv_access_token', { httpOnly: true, sameSite: 'lax', path: '/' });
    res.clearCookie('sv_refresh_token', { httpOnly: true, sameSite: 'lax', path: '/' });
  }
}

