import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const STRATEGY_PHRASES: Record<string, string> = {
  quiet_time: 'take some quiet time',
  breathing: 'try a breathing exercise',
  trusted_adult: 'talk to a grown-up you trust',
  movement: 'get up and move around a bit',
};

const VALID_ZONES = ['calm', 'okay', 'worried', 'big_feelings'] as const;

@Injectable()
export class ZoneCheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordCheckIn(guardianId: string, zone: string) {
    if (!VALID_ZONES.includes(zone as any)) {
      throw new BadRequestException('Invalid emotional zone.');
    }

    const child = await this.prisma.child.findFirst({
      where: { guardianId },
    });
    if (!child) {
      throw new NotFoundException('Child profile not found.');
    }

    // Persist ZoneCheckIn
    const record = await this.prisma.zoneCheckIn.create({
      data: {
        childId: child.id,
        zone,
      },
    });

    // Lookup child's preferred regulation strategy
    let strategyPhrase = 'try a breathing exercise';
    const prefs = await this.prisma.childPreferences.findUnique({
      where: { childId: child.id },
    });

    if (prefs?.q6RegulationStrategy) {
      try {
        const parsed = JSON.parse(prefs.q6RegulationStrategy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const topStrategy = parsed[0];
          if (STRATEGY_PHRASES[topStrategy]) {
            strategyPhrase = STRATEGY_PHRASES[topStrategy];
          }
        }
      } catch {}
    }

    let mood = 'happy';
    let line = "Glad you're feeling good!";

    switch (zone) {
      case 'calm':
        mood = 'happy';
        line = "Glad you're feeling good!";
        break;
      case 'okay':
        mood = 'attentive';
        line = "Doing okay? I'm here if you want to chat.";
        break;
      case 'worried':
        mood = 'concerned';
        line = `Want to ${strategyPhrase}? I'll come with you.`;
        break;
      case 'big_feelings':
        mood = 'gentle';
        line = "That's a big feeling. Let's go to the Calm Cove together?";
        break;
    }

    return {
      id: record.id,
      zone,
      mood,
      line,
      createdAt: record.createdAt,
    };
  }
}

