export interface ThemeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isBuilt: boolean;
}

export const THEMES_CATALOG: ThemeInfo[] = [
  {
    id: 'space',
    name: 'Space Explorer',
    emoji: '🚀',
    description: 'Cosmic stars, nebula colors, and astronaut gear.',
    isBuilt: true,
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    emoji: '🌊',
    description: 'Gentle coral reefs, deep blue tides, and diving helmets.',
    isBuilt: true,
  },
  {
    id: 'jungle',
    name: 'Wild Jungle',
    emoji: '🌴',
    description: 'Canopy greens, warm sunlight, and safari hats.',
    isBuilt: true,
  },
  {
    id: 'city',
    name: 'Busy City',
    emoji: '🏙️',
    description: 'Skyscrapers, bustling streets, and engineer vests.',
    isBuilt: false,
  },
  {
    id: 'magic',
    name: 'Magic Castle',
    emoji: '🏰',
    description: 'Spells, glowing crystals, and wizard capes.',
    isBuilt: false,
  },
  {
    id: 'sports',
    name: 'Champions Stadium',
    emoji: '⚽',
    description: 'Tracks, roaring cheers, and athletic jerseys.',
    isBuilt: false,
  },
];

