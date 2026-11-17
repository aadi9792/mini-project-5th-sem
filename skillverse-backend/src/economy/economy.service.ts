import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export function computeLevel(stars: number) {
  // 09 §3.2 formula: level = Math.floor(stars / 50) + 1
  const level = Math.floor((stars || 0) / 50) + 1;
  const starsIntoLevel = (stars || 0) % 50;
  const starsNeededForLevel = 50;
  return { level, starsIntoLevel, starsNeededForLevel };
}

@Injectable()
export class EconomyService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChildForGuardian(guardianId: string) {
    const child = await this.prisma.child.findFirst({
      where: { guardianId },
    });
    if (!child) {
      throw new NotFoundException('Child profile not found.');
    }
    return child;
  }

  async getSummary(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const { level, starsIntoLevel, starsNeededForLevel } = computeLevel(child.totalStars);

    const equipped = await this.prisma.ownedShopItem.findMany({
      where: { childId: child.id, equipped: true },
    });
    const catalog = await this.prisma.shopItemCatalog.findMany({
      where: { id: { in: equipped.map((e) => e.itemId) } },
    });
    const itemMap = new Map(catalog.map((i) => [i.id, i]));

    return {
      totalStars: child.totalStars,
      totalCoins: child.totalCoins,
      level,
      starsIntoLevel,
      starsNeededForLevel,
      avatarBaseFace: child.avatarBaseFace || '😀',
      equippedItems: equipped.map((e) => itemMap.get(e.itemId)).filter(Boolean),
    };
  }

  async getShop(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const items = await this.prisma.shopItemCatalog.findMany();
    const owned = await this.prisma.ownedShopItem.findMany({
      where: { childId: child.id },
    });

    const ownedMap = new Map(owned.map((o) => [o.itemId, o]));

    const catalogWithStatus = items.map((item) => {
      const ownedRecord = ownedMap.get(item.id);
      return {
        ...item,
        isOwned: !!ownedRecord,
        isEquipped: ownedRecord?.equipped ?? false,
      };
    });

    return {
      coins: child.totalCoins,
      items: catalogWithStatus,
    };
  }

  async buyItem(guardianId: string, itemId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const item = await this.prisma.shopItemCatalog.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException('Item not found.');
    }

    const existing = await this.prisma.ownedShopItem.findFirst({
      where: { childId: child.id, itemId },
    });
    if (existing) {
      throw new BadRequestException('You already own this item.');
    }

    if (child.totalCoins < item.priceCoins) {
      throw new BadRequestException("You don't have enough coins yet.");
    }

    // Deduct coins & create owned record
    const [updatedChild, ownedItem] = await this.prisma.$transaction([
      this.prisma.child.update({
        where: { id: child.id },
        data: { totalCoins: child.totalCoins - item.priceCoins },
      }),
      this.prisma.ownedShopItem.create({
        data: {
          childId: child.id,
          itemId,
          equipped: false,
        },
      }),
    ]);

    // Check & award "first-purchase" badge
    await this.checkAndAwardBadge(child.id, 'first-purchase');

    return {
      message: 'Item purchased!',
      coinsRemaining: updatedChild.totalCoins,
      item,
      ownedItem,
    };
  }

  async equipItem(guardianId: string, itemId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const targetItem = await this.prisma.shopItemCatalog.findUnique({
      where: { id: itemId },
    });
    if (!targetItem) {
      throw new NotFoundException('Item not found.');
    }

    const owned = await this.prisma.ownedShopItem.findFirst({
      where: { childId: child.id, itemId },
    });
    if (!owned) {
      throw new BadRequestException('You do not own this item.');
    }

    // Unequip any existing item in the same category
    const sameCategoryItems = await this.prisma.shopItemCatalog.findMany({
      where: { category: targetItem.category },
    });
    const sameCategoryIds = sameCategoryItems.map((i) => i.id);

    await this.prisma.$transaction([
      this.prisma.ownedShopItem.updateMany({
        where: {
          childId: child.id,
          itemId: { in: sameCategoryIds },
        },
        data: { equipped: false },
      }),
      this.prisma.ownedShopItem.update({
        where: { id: owned.id },
        data: { equipped: true },
      }),
    ]);

    return { message: 'Item equipped!', itemId };
  }

  async unequipItem(guardianId: string, itemId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const owned = await this.prisma.ownedShopItem.findFirst({
      where: { childId: child.id, itemId },
    });
    if (!owned) {
      throw new BadRequestException('You do not own this item.');
    }

    await this.prisma.ownedShopItem.update({
      where: { id: owned.id },
      data: { equipped: false },
    });

    return { message: 'Item unequipped!', itemId };
  }

  async setAvatarFace(guardianId: string, face: string) {
    const child = await this.getChildForGuardian(guardianId);
    const updated = await this.prisma.child.update({
      where: { id: child.id },
      data: { avatarBaseFace: face },
    });
    return { avatarBaseFace: updated.avatarBaseFace };
  }

  async getWins(guardianId: string) {
    const child = await this.getChildForGuardian(guardianId);
    const { level } = computeLevel(child.totalStars);

    // Badges
    const allBadges = await this.prisma.badgeCatalog.findMany();
    const earnedBadges = await this.prisma.earnedBadge.findMany({
      where: { childId: child.id },
    });
    const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

    const badgesWithStatus = allBadges.map((b) => ({
      ...b,
      earned: earnedBadgeIds.has(b.id),
      earnedAt: earnedBadges.find((eb) => eb.badgeId === b.id)?.earnedAt || null,
    }));

    // Collectibles
    const allCollectibles = await this.prisma.collectibleCatalog.findMany();
    const earnedCollectibles = await this.prisma.ownedCollectible.findMany({
      where: { childId: child.id },
    });
    const earnedColIds = new Set(earnedCollectibles.map((c) => c.collectibleId));

    const collectiblesWithStatus = allCollectibles.map((c) => ({
      ...c,
      earned: earnedColIds.has(c.id),
      earnedAt: earnedCollectibles.find((ec) => ec.collectibleId === c.id)?.earnedAt || null,
    }));

    return {
      nickname: child.nickname,
      avatarBaseFace: child.avatarBaseFace || '😀',
      totalStars: child.totalStars,
      totalCoins: child.totalCoins,
      level,
      badges: badgesWithStatus,
      collectibles: collectiblesWithStatus,
    };
  }

  async recordQuestCompletion(
    guardianId: string,
    payload: {
      questType: 'GAME' | 'REAL_LIFE';
      gameId?: string;
      mode?: 'normal' | 'boss';
      realLifeQuestId?: string;
      remindersLevel?: 'none' | 'a_couple' | 'a_lot' | null;
      worldId?: string;
    },
  ) {
    const child = await this.getChildForGuardian(guardianId);

    // Reward amounts from 09 §3.1 & 10 §4.1
    let starsAwarded = 3;
    let coinsAwarded = 2;

    if (payload.questType === 'GAME') {
      if (payload.mode === 'boss') {
        starsAwarded = 5;
        coinsAwarded = 5;
      }
    } else if (payload.questType === 'REAL_LIFE' && payload.realLifeQuestId) {
      const rQuest = await this.prisma.realLifeQuest.findUnique({
        where: { id: payload.realLifeQuestId },
      });
      if (rQuest) {
        starsAwarded = rQuest.rewardStars;
        coinsAwarded = rQuest.rewardCoins;
      }
    }

    const previousLevel = computeLevel(child.totalStars).level;

    // Record QuestCompletion & increment child balance
    const [completion, updatedChild] = await this.prisma.$transaction([
      this.prisma.questCompletion.create({
        data: {
          childId: child.id,
          questType: payload.questType,
          gameId: payload.gameId || null,
          mode: payload.mode || null,
          realLifeQuestId: payload.realLifeQuestId || null,
          remindersLevel: payload.remindersLevel || null,
          starsAwarded,
          coinsAwarded,
        },
      }),
      this.prisma.child.update({
        where: { id: child.id },
        data: {
          totalStars: child.totalStars + starsAwarded,
          totalCoins: child.totalCoins + coinsAwarded,
        },
      }),
    ]);

    const newLevelInfo = computeLevel(updatedChild.totalStars);
    const leveledUp = newLevelInfo.level > previousLevel;

    // Increment GameProgress if GAME
    if (payload.questType === 'GAME' && payload.gameId) {
      await this.prisma.gameProgress.upsert({
        where: {
          childId_gameId: { childId: child.id, gameId: payload.gameId },
        },
        create: {
          childId: child.id,
          gameId: payload.gameId,
          completedSessionsCount: 1,
          bossBattlesWonCount: payload.mode === 'boss' ? 1 : 0,
        },
        update: {
          completedSessionsCount: { increment: 1 },
          bossBattlesWonCount: payload.mode === 'boss' ? { increment: 1 } : undefined,
        },
      });
    }

    // 20% Roll for unearned collectible from world
    let newCollectible = null;
    const worldId = payload.worldId || (payload.gameId === 'volcano-scale' ? 'feelings' : payload.gameId === 'face-detective' ? 'faces' : 'time');
    const shouldRoll = Math.random() < 0.2; // 20%
    if (shouldRoll) {
      const ownedCols = await this.prisma.ownedCollectible.findMany({
        where: { childId: child.id },
      });
      const ownedIds = new Set(ownedCols.map((o) => o.collectibleId));
      const availableCols = await this.prisma.collectibleCatalog.findMany({
        where: { worldId, id: { notIn: Array.from(ownedIds) } },
      });

      if (availableCols.length > 0) {
        const picked = availableCols[Math.floor(Math.random() * availableCols.length)];
        await this.prisma.ownedCollectible.create({
          data: {
            childId: child.id,
            collectibleId: picked.id,
          },
        });
        newCollectible = picked;
      }
    }

    // Trigger Badges check
    const newlyEarnedBadges: any[] = [];
    // 1. first-quest
    const b1 = await this.checkAndAwardBadge(child.id, 'first-quest');
    if (b1) newlyEarnedBadges.push(b1);

    // 2. first-mini-game
    if (payload.questType === 'GAME') {
      const b2 = await this.checkAndAwardBadge(child.id, 'first-mini-game');
      if (b2) newlyEarnedBadges.push(b2);
    }

    // 3. boss-defeated
    if (payload.mode === 'boss') {
      const b3 = await this.checkAndAwardBadge(child.id, 'boss-defeated');
      if (b3) newlyEarnedBadges.push(b3);
    }

    // 4. getting-started (5 quests total)
    const totalCompletions = await this.prisma.questCompletion.count({ where: { childId: child.id } });
    if (totalCompletions >= 5) {
      const b4 = await this.checkAndAwardBadge(child.id, 'getting-started');
      if (b4) newlyEarnedBadges.push(b4);
    }

    // 5. level milestones
    if (newLevelInfo.level >= 5) {
      const b5 = await this.checkAndAwardBadge(child.id, 'level-5');
      if (b5) newlyEarnedBadges.push(b5);
    }
    if (newLevelInfo.level >= 10) {
      const b6 = await this.checkAndAwardBadge(child.id, 'level-10');
      if (b6) newlyEarnedBadges.push(b6);
    }

    // 6. world-explorer (played in all 3 MVP worlds)
    const progressRecords = await this.prisma.gameProgress.findMany({
      where: { childId: child.id, completedSessionsCount: { gte: 1 } },
    });
    const playedGameIds = new Set(progressRecords.map((p) => p.gameId));
    if (playedGameIds.has('launch-challenge') && playedGameIds.has('volcano-scale') && playedGameIds.has('face-detective')) {
      const b7 = await this.checkAndAwardBadge(child.id, 'world-explorer');
      if (b7) newlyEarnedBadges.push(b7);
    }

    return {
      starsAwarded,
      coinsAwarded,
      newTotalStars: updatedChild.totalStars,
      newTotalCoins: updatedChild.totalCoins,
      level: newLevelInfo.level,
      leveledUp,
      newlyEarnedBadges,
      newCollectible,
    };
  }

  private async checkAndAwardBadge(childId: string, badgeId: string) {
    const existing = await this.prisma.earnedBadge.findFirst({
      where: { childId, badgeId },
    });
    if (!existing) {
      const earned = await this.prisma.earnedBadge.create({
        data: { childId, badgeId },
      });
      const badge = await this.prisma.badgeCatalog.findUnique({ where: { id: badgeId } });
      return badge;
    }
    return null;
  }
}

