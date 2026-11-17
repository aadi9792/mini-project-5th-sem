import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JourneyService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChildForGuardian(guardianId: string) {
    const child = await this.prisma.child.findFirst({ where: { guardianId } });
    if (!child) throw new NotFoundException('Child profile not found.');
    return child;
  }

  private clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  async getQuestsForDate(guardianId: string, date: string) {
    const child = await this.getChildForGuardian(guardianId);
    // date is YYYY-MM-DD; match by day (scheduledFor stored as start-of-day UTC)
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');

    const quests = await this.prisma.realLifeQuest.findMany({
      where: { childId: child.id, scheduledFor: { gte: dayStart, lte: dayEnd } },
      orderBy: { orderIndex: 'asc' },
    });

    // Attach completion status
    const questIds = quests.map((q) => q.id);
    const completions = await this.prisma.questCompletion.findMany({
      where: { childId: child.id, realLifeQuestId: { in: questIds } },
    });
    const completedIds = new Set(completions.map((c) => c.realLifeQuestId));

    return quests.map((q) => ({ ...q, completed: completedIds.has(q.id) }));
  }

  async createQuest(guardianId: string, body: {
    templateId?: string | null;
    label: string;
    emoji: string;
    scheduledFor: string;
    rewardStars?: number;
    rewardCoins?: number;
  }) {
    const child = await this.getChildForGuardian(guardianId);
    const dayStart = new Date(body.scheduledFor.split('T')[0] + 'T00:00:00.000Z');
    const dayEnd = new Date(body.scheduledFor.split('T')[0] + 'T23:59:59.999Z');

    // Get max orderIndex for this day
    const existing = await this.prisma.realLifeQuest.findMany({
      where: { childId: child.id, scheduledFor: { gte: dayStart, lte: dayEnd } },
      orderBy: { orderIndex: 'desc' },
      take: 1,
    });
    const orderIndex = existing.length > 0 ? existing[0].orderIndex + 1 : 0;

    const quest = await this.prisma.realLifeQuest.create({
      data: {
        childId: child.id,
        templateId: body.templateId || null,
        label: body.label.trim(),
        emoji: body.emoji,
        scheduledFor: dayStart,
        orderIndex,
        rewardStars: this.clamp(body.rewardStars ?? 10, 5, 50),
        rewardCoins: this.clamp(body.rewardCoins ?? 5, 0, 25),
      },
    });

    return { quest };
  }

  async updateQuest(guardianId: string, questId: string, body: {
    label?: string;
    emoji?: string;
    rewardStars?: number;
    rewardCoins?: number;
  }) {
    const child = await this.getChildForGuardian(guardianId);
    const quest = await this.prisma.realLifeQuest.findUnique({ where: { id: questId } });

    if (!quest || quest.childId !== child.id) throw new NotFoundException('Quest not found.');

    // Check if already completed
    const completion = await this.prisma.questCompletion.findFirst({
      where: { childId: child.id, realLifeQuestId: questId },
    });
    if (completion) throw new ForbiddenException('Cannot edit a completed quest.');

    const updated = await this.prisma.realLifeQuest.update({
      where: { id: questId },
      data: {
        label: body.label?.trim(),
        emoji: body.emoji,
        rewardStars: body.rewardStars !== undefined ? this.clamp(body.rewardStars, 5, 50) : undefined,
        rewardCoins: body.rewardCoins !== undefined ? this.clamp(body.rewardCoins, 0, 25) : undefined,
      },
    });

    return { quest: updated };
  }

  async deleteQuest(guardianId: string, questId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const quest = await this.prisma.realLifeQuest.findUnique({ where: { id: questId } });

    if (!quest || quest.childId !== child.id) throw new NotFoundException('Quest not found.');

    const completion = await this.prisma.questCompletion.findFirst({
      where: { childId: child.id, realLifeQuestId: questId },
    });
    if (completion) throw new ForbiddenException('Cannot delete a completed quest.');

    await this.prisma.realLifeQuest.delete({ where: { id: questId } });
    return { message: 'Quest deleted.' };
  }

  async reorderQuests(guardianId: string, body: { date: string; orderedQuestIds: string[] }) {
    const child = await this.getChildForGuardian(guardianId);

    // Atomically update all orderIndex values
    await this.prisma.$transaction(
      body.orderedQuestIds.map((id, index) =>
        this.prisma.realLifeQuest.updateMany({
          where: { id, childId: child.id },
          data: { orderIndex: index },
        }),
      ),
    );

    return this.getQuestsForDate(guardianId, body.date);
  }

  async repeatYesterday(guardianId: string, forDate: string) {
    const child = await this.getChildForGuardian(guardianId);

    const yesterday = new Date(forDate + 'T00:00:00.000Z');
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayEnd = new Date(yesterdayStr + 'T23:59:59.999Z');

    const yesterdayQuests = await this.prisma.realLifeQuest.findMany({
      where: { childId: child.id, scheduledFor: { gte: yesterday, lte: yesterdayEnd } },
      orderBy: { orderIndex: 'asc' },
    });

    if (yesterdayQuests.length === 0) {
      return { quests: [], message: 'No quests found for yesterday.' };
    }

    const todayStart = new Date(forDate + 'T00:00:00.000Z');

    const created = await this.prisma.$transaction(
      yesterdayQuests.map((q, index) =>
        this.prisma.realLifeQuest.create({
          data: {
            childId: child.id,
            templateId: q.templateId,
            label: q.label,
            emoji: q.emoji,
            scheduledFor: todayStart,
            orderIndex: index,
            rewardStars: q.rewardStars,
            rewardCoins: q.rewardCoins,
          },
        }),
      ),
    );

    return { quests: created };
  }

  async getTemplates() {
    return this.prisma.realLifeQuestTemplate.findMany();
  }
}

