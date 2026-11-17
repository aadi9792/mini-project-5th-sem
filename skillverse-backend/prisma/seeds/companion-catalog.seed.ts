import { PrismaClient } from '@prisma/client';

export const COMPANION_SEEDS = [
  {
    speciesId: 'robot',
    displayName: 'Robot',
    emoji: '🤖',
    personalityBlurb: 'Curious and clever, always ready to figure things out with you.',
    isStarter: true,
    unlockLevel: null,
  },
  {
    speciesId: 'dragon',
    displayName: 'Dragon',
    emoji: '🐲',
    personalityBlurb: 'Bold and playful, loves cheering you on for every brave step.',
    isStarter: true,
    unlockLevel: null,
  },
  {
    speciesId: 'owl',
    displayName: 'Owl',
    emoji: '🦉',
    personalityBlurb: 'Calm and thoughtful, great for quiet moments together.',
    isStarter: true,
    unlockLevel: null,
  },
  {
    speciesId: 'fox',
    displayName: 'Fox',
    emoji: '🦊',
    personalityBlurb: 'Clever and quick, loves a good challenge.',
    isStarter: false,
    unlockLevel: 5,
  },
  {
    speciesId: 'turtle',
    displayName: 'Turtle',
    emoji: '🐢',
    personalityBlurb: 'Steady and patient, always has time for you.',
    isStarter: false,
    unlockLevel: 10,
  },
  {
    speciesId: 'octopus',
    displayName: 'Octopus',
    emoji: '🐙',
    personalityBlurb: 'Creative and flexible, good at trying new things.',
    isStarter: false,
    unlockLevel: 25,
  },
];

export async function seedCompanions(prisma: PrismaClient) {
  for (const c of COMPANION_SEEDS) {
    await prisma.companionTemplate.upsert({
      where: { speciesId: c.speciesId },
      update: c,
      create: c,
    });
  }
  console.log('Seeded 6 CompanionTemplate entries.');
}

