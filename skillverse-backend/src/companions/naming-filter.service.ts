import { Injectable, BadRequestException } from '@nestjs/common';

const BLOCKED_WORDS = [
  'badword', 'swear', 'damn', 'hell', 'crap', 'stupid', 'idiot',
  'hate', 'ugly', 'kill', 'die', 'murder', 'blood',
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'piss', 'cunt', 'whore', 'slut',
];

@Injectable()
export class NamingFilterService {
  validateName(name: string): string {
    const trimmed = name?.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 15) {
      throw new BadRequestException('Give your companion a name (2–15 letters).');
    }

    const lower = trimmed.toLowerCase();
    for (const blocked of BLOCKED_WORDS) {
      if (lower.includes(blocked)) {
        // Exact copy from 03 §3.6: deliberately non-accusatory
        throw new BadRequestException("Let's pick a different name for your companion.");
      }
    }

    return trimmed;
  }
}

