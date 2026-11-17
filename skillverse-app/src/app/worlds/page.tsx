'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const ALL_WORLDS = [
  { id: 'time', name: 'Time World', emoji: '🕐', description: 'Clocks, sequences, and the passage of time', games: ['Launch Challenge'], available: true, color: '#6C63FF' },
  { id: 'feelings', name: 'Feelings World', emoji: '🌋', description: 'Understanding and naming emotions', games: ['Volcano Scale'], available: true, color: '#FF6B6B' },
  { id: 'faces', name: 'Faces World', emoji: '🎭', description: 'Reading facial expressions and body language', games: ['Face Detective'], available: true, color: '#FFD166' },
  { id: 'shapes', name: 'Shapes World', emoji: '🔷', description: 'Geometric patterns and spatial reasoning', games: [], available: false },
  { id: 'numbers', name: 'Numbers World', emoji: '🔢', description: 'Counting, patterns, and math concepts', games: [], available: false },
  { id: 'sounds', name: 'Sounds World', emoji: '🎵', description: 'Auditory patterns and music', games: [], available: false },
  { id: 'movement', name: 'Movement World', emoji: '🏃', description: 'Body coordination and gross motor skills', games: [], available: false },
  { id: 'words', name: 'Words World', emoji: '📖', description: 'Language, reading, and communication', games: [], available: false },
  { id: 'nature', name: 'Nature World', emoji: '🌿', description: 'Science, animals, and the natural world', games: [], available: false },
];

export default function WorldsPage() {
  return (
    <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/hub" className="rounded-full p-2 bg-[var(--sv-card-tint)] hover:bg-[var(--sv-primary)]/10 transition" aria-label="Back to Hub">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">🌍 World Atlas</h1>
            <p className="text-[var(--sv-text-soft)] text-sm">Every skill world in Skillverse</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_WORLDS.map((w) => (
            <div
              key={w.id}
              className={`rounded-2xl p-5 border flex flex-col gap-3 transition-all ${
                w.available
                  ? 'bg-white/80 dark:bg-white/10 border-[var(--sv-primary)]/20 hover:shadow-lg'
                  : 'bg-[var(--sv-card-tint)] border-transparent opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{w.emoji}</span>
                <div>
                  <h2 className="font-heading font-bold text-lg">{w.name}</h2>
                  {!w.available && <span className="text-[11px] font-bold text-[var(--sv-text-soft)] bg-[var(--sv-card-tint)] px-2 py-0.5 rounded-full">Coming Soon</span>}
                </div>
              </div>
              <p className="text-[var(--sv-text-soft)] text-sm">{w.description}</p>
              {w.games.length > 0 && (
                <div className="text-[12px] text-[var(--sv-text-soft)]">
                  <strong>Games:</strong> {w.games.join(', ')}
                </div>
              )}
              {w.available && (
                <Link
                  href={`/worlds/${w.id}`}
                  className="mt-auto inline-flex items-center justify-center h-10 px-5 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-sm hover:opacity-90 transition"
                >
                  Enter World →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

