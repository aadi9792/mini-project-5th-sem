import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Tier = 'easy' | 'medium' | 'hard';

@Injectable()
export class DifficultyService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChildForGuardian(guardianId: string) {
    return this.prisma.child.findFirst({ where: { guardianId } });
  }

  private coldStartTier(granularity: string | null): Tier {
    // 08 §3.2: cold-start matches 02's taskBreakdownGranularity
    if (granularity === 'fine') return 'easy';
    if (granularity === 'coarse') return 'hard';
    return 'medium'; // 'medium' granularity or null
  }

  async getProfile(guardianId: string, gameId: string): Promise<{ tier: Tier }> {
    const child = await this.getChildForGuardian(guardianId);
    if (!child) return { tier: 'medium' };

    const profile = await this.prisma.gameDifficultyProfile.findUnique({
      where: { childId_gameId: { childId: child.id, gameId } },
    });

    if (profile) {
      return { tier: profile.tier as Tier };
    }

    // Cold start: derive taskBreakdownGranularity from q4AttentionSpan per 02 §4.4
    const prefs = await this.prisma.childPreferences.findUnique({
      where: { childId: child.id },
    });
    // q4 maps: under_3 -> fine(easy), 3_to_7 -> fine(easy), 7_to_15 -> medium, 15_plus -> coarse(hard)
    let granularity: string | null = null;
    if (prefs) {
      if (prefs.q4AttentionSpan === 'under_3' || prefs.q4AttentionSpan === '3_to_7') granularity = 'fine';
      else if (prefs.q4AttentionSpan === '7_to_15') granularity = 'medium';
      else if (prefs.q4AttentionSpan === '15_plus') granularity = 'coarse';
    }
    return { tier: this.coldStartTier(granularity) };
  }

  async upsertProfile(guardianId: string, gameId: string, tier: Tier): Promise<{ tier: Tier }> {
    const child = await this.getChildForGuardian(guardianId);
    if (!child) return { tier };

    const profile = await this.prisma.gameDifficultyProfile.upsert({
      where: { childId_gameId: { childId: child.id, gameId } },
      create: { childId: child.id, gameId, tier },
      update: { tier },
    });

    return { tier: profile.tier as Tier };
  }

  async getAllProfiles(guardianId: string): Promise<{ gameId: string; tier: Tier }[]> {
    const child = await this.getChildForGuardian(guardianId);
    if (!child) return [];

    const profiles = await this.prisma.gameDifficultyProfile.findMany({
      where: { childId: child.id },
    });

    return profiles.map((p) => ({ gameId: p.gameId, tier: p.tier as Tier }));
  }
}
