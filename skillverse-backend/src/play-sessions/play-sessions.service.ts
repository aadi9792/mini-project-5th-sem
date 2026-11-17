import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaySessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChildForGuardian(guardianId: string) {
    const child = await this.prisma.child.findFirst({ where: { guardianId } });
    if (!child) throw new NotFoundException('Child profile not found.');
    return child;
  }

  async startSession(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const session = await this.prisma.playSession.create({
      data: { childId: child.id },
    });
    return { sessionId: session.id };
  }

  async heartbeat(sessionId: string) {
    await this.prisma.playSession.update({
      where: { id: sessionId },
      data: { lastHeartbeatAt: new Date() },
    });
    return { ok: true };
  }

  async endSession(sessionId: string) {
    await this.prisma.playSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
    return { ok: true };
  }
}

