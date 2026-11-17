import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeLevel } from '../economy/economy.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChildForGuardian(guardianId: string) {
    const child = await this.prisma.child.findFirst({ where: { guardianId } });
    if (!child) throw new NotFoundException('Child profile not found.');
    return child;
  }

  private rollingWindow(days: number) {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  async getMissionReport(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const thisWeek = this.rollingWindow(7);
    const lastWeek = { start: this.rollingWindow(14).start, end: this.rollingWindow(7).start };

    // ── Real-life quests ──────────────────────────────────────────────────────
    const allQuestsThisWeek = await this.prisma.realLifeQuest.findMany({
      where: { childId: child.id, scheduledFor: { gte: thisWeek.start, lte: thisWeek.end } },
    });
    const completedRLThisWeek = await this.prisma.questCompletion.findMany({
      where: {
        childId: child.id,
        questType: 'REAL_LIFE',
        completedAt: { gte: thisWeek.start, lte: thisWeek.end },
      },
    });
    const completedRLLastWeek = await this.prisma.questCompletion.findMany({
      where: {
        childId: child.id,
        questType: 'REAL_LIFE',
        completedAt: { gte: lastWeek.start, lte: lastWeek.end },
      },
    });

    // ── Reminders breakdown ───────────────────────────────────────────────────
    const remindersBreakdown = { none: 0, a_couple: 0, a_lot: 0 };
    for (const c of completedRLThisWeek) {
      if (c.remindersLevel === 'none') remindersBreakdown.none++;
      else if (c.remindersLevel === 'a_couple') remindersBreakdown.a_couple++;
      else if (c.remindersLevel === 'a_lot') remindersBreakdown.a_lot++;
    }

    // ── Game sessions ─────────────────────────────────────────────────────────
    const gameCompletionsThisWeek = await this.prisma.questCompletion.findMany({
      where: {
        childId: child.id,
        questType: 'GAME',
        completedAt: { gte: thisWeek.start, lte: thisWeek.end },
      },
    });
    const gameBreakdown: Record<string, number> = {};
    const worldMap: Record<string, string> = {
      'launch-challenge': 'Time World',
      'volcano-scale': 'Feelings World',
      'face-detective': 'Faces World',
    };
    for (const g of gameCompletionsThisWeek) {
      const worldName = worldMap[g.gameId || ''] || g.gameId || 'Unknown';
      gameBreakdown[worldName] = (gameBreakdown[worldName] || 0) + 1;
    }

    // ── Stars & Coins earned this week ────────────────────────────────────────
    const allCompletionsThisWeek = await this.prisma.questCompletion.findMany({
      where: { childId: child.id, completedAt: { gte: thisWeek.start, lte: thisWeek.end } },
    });
    const starsThisWeek = allCompletionsThisWeek.reduce((s, c) => s + c.starsAwarded, 0);
    const coinsThisWeek = allCompletionsThisWeek.reduce((s, c) => s + c.coinsAwarded, 0);

    // ── Emotional check-ins ───────────────────────────────────────────────────
    const checkIns = await this.prisma.zoneCheckIn.findMany({
      where: { childId: child.id, createdAt: { gte: thisWeek.start, lte: thisWeek.end } },
    });
    const checkInsByZone: Record<string, number> = { calm: 0, okay: 0, worried: 0, big_feelings: 0 };
    for (const ci of checkIns) {
      checkInsByZone[ci.zone] = (checkInsByZone[ci.zone] || 0) + 1;
    }

    // ── Badges ────────────────────────────────────────────────────────────────
    const earnedBadges = await this.prisma.earnedBadge.findMany({
      where: { childId: child.id },
    });
    const badgeCatalog = await this.prisma.badgeCatalog.findMany({
      where: { id: { in: earnedBadges.map((b) => b.badgeId) } },
    });
    const badgeMap = new Map(badgeCatalog.map((b) => [b.id, b]));

    // ── Difficulty profiles per game ──────────────────────────────────────────
    const diffProfiles = await this.prisma.gameDifficultyProfile.findMany({
      where: { childId: child.id },
    });
    const diffByGame: Record<string, string> = {};
    for (const dp of diffProfiles) {
      diffByGame[dp.gameId] = dp.tier;
    }

    // ── Level ─────────────────────────────────────────────────────────────────
    const { level } = computeLevel(child.totalStars);

    return {
      nickname: child.nickname,
      level,
      totalStars: child.totalStars,
      totalCoins: child.totalCoins,
      thisWeek: {
        realLifeQuests: {
          scheduled: allQuestsThisWeek.length,
          completed: completedRLThisWeek.length,
          completedLastWeek: completedRLLastWeek.length,
        },
        reminders: remindersBreakdown,
        gameSessions: {
          total: gameCompletionsThisWeek.length,
          byWorld: gameBreakdown,
        },
        starsEarned: starsThisWeek,
        coinsEarned: coinsThisWeek,
        checkIns: {
          total: checkIns.length,
          byZone: checkInsByZone,
        },
      },
      badges: earnedBadges.map((b) => ({ ...badgeMap.get(b.badgeId), earnedAt: b.earnedAt })),
      difficultyProfiles: diffByGame,
    };
  }
}

