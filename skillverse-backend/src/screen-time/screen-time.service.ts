import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScreenTimeService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChildForGuardian(guardianId: string) {
    const child = await this.prisma.child.findFirst({ where: { guardianId } });
    if (!child) throw new NotFoundException('Child profile not found.');
    return child;
  }

  private IDLE_CUTOFF_MS = 20 * 60 * 1000; // 20 minutes

  private computeSessionMinutes(sessions: { startedAt: Date; lastHeartbeatAt: Date; endedAt: Date | null }[]) {
    const cutoff = new Date(Date.now() - this.IDLE_CUTOFF_MS);
    let totalMs = 0;
    for (const s of sessions) {
      const end = s.endedAt ?? (s.lastHeartbeatAt < cutoff ? s.lastHeartbeatAt : new Date());
      totalMs += end.getTime() - s.startedAt.getTime();
    }
    return Math.round(totalMs / 60000);
  }

  async getScreenTime(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);

    const settings = await this.prisma.screenTimeSettings.findUnique({
      where: { childId: child.id },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const todaySessions = await this.prisma.playSession.findMany({
      where: { childId: child.id, startedAt: { gte: todayStart } },
    });
    const weekSessions = await this.prisma.playSession.findMany({
      where: { childId: child.id, startedAt: { gte: weekStart } },
    });

    return {
      settings: {
        quietHoursStart: settings?.quietHoursStart ?? null,
        quietHoursEnd: settings?.quietHoursEnd ?? null,
      },
      todayMinutes: this.computeSessionMinutes(todaySessions),
      weekMinutes: this.computeSessionMinutes(weekSessions),
    };
  }

  async updateSettings(guardianId: string, body: { quietHoursStart?: string | null; quietHoursEnd?: string | null }) {
    const child = await this.getChildForGuardian(guardianId);

    const settings = await this.prisma.screenTimeSettings.upsert({
      where: { childId: child.id },
      create: {
        childId: child.id,
        quietHoursStart: body.quietHoursStart ?? null,
        quietHoursEnd: body.quietHoursEnd ?? null,
      },
      update: {
        quietHoursStart: body.quietHoursStart ?? null,
        quietHoursEnd: body.quietHoursEnd ?? null,
      },
    });

    return { settings };
  }
}

