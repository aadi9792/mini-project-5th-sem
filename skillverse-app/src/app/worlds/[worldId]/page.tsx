'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const WORLD_DATA: Record<string, {
  name: string; emoji: string; color: string; lore: string;
  games: { id: string; name: string; emoji: string; desc: string; href: string; mode?: 'boss' }[];
  knowledgeVault: { emoji: string; fact: string }[];
}> = {
  time: {
    name: 'Time World', emoji: '🕐', color: '#6C63FF',
    lore: 'Welcome to the Time Nexus! Here, the clocks tick to a different rhythm. Learn the secrets of seconds, minutes, and the great river of time.',
    games: [
      { id: 'launch-challenge', name: 'Launch Challenge', emoji: '🚀', desc: 'Schedule a rocket launch — timing is everything!', href: '/games/launch-challenge' },
      { id: 'launch-challenge-boss', name: 'Boss Battle: Mega Launch', emoji: '⚡🚀', desc: '8-round speed challenge — are you ready?', href: '/games/launch-challenge?mode=boss' },
    ],
    knowledgeVault: [
      { emoji: '⏰', fact: '60 seconds make 1 minute, 60 minutes make 1 hour.' },
      { emoji: '🗓️', fact: 'A day has 24 hours, a week has 7 days.' },
      { emoji: '🌙', fact: 'Morning is AM (ante meridiem), afternoon is PM (post meridiem).' },
      { emoji: '🚂', fact: 'Sequences have a "before" and "after" — just like train cars!' },
    ],
  },
  feelings: {
    name: 'Feelings World', emoji: '🌋', color: '#FF6B6B',
    lore: 'The Feelings Volcano is always rumbling! Every emotion is valid. Here you learn to name them, understand their intensity, and find your calm.',
    games: [
      { id: 'volcano-scale', name: 'Calm the Volcano', emoji: '🌋', desc: 'Match the feeling to how big it feels inside.', href: '/games/volcano-scale' },
      { id: 'volcano-scale-boss', name: 'Boss Battle: Eruption Zone', emoji: '⚡🌋', desc: '8-round feelings deep-dive challenge.', href: '/games/volcano-scale?mode=boss' },
    ],
    knowledgeVault: [
      { emoji: '😌', fact: 'Feelings like calm are small and quiet — like a sleeping volcano.' },
      { emoji: '😊', fact: 'Happy feelings are warm and light inside your chest.' },
      { emoji: '😟', fact: 'Worried feelings are normal — everyone feels them sometimes.' },
      { emoji: '🌋', fact: '"Big feelings" are strong — and they always calm down with time.' },
    ],
  },
  faces: {
    name: 'Faces World', emoji: '🎭', color: '#FFD166',
    lore: 'The Gallery of Expressions is full of clues! Every face tells a story. Become a Face Detective and decode what people are feeling.',
    games: [
      { id: 'face-detective', name: 'Face Detective', emoji: '🔍', desc: 'Match the expression to the feeling — can you crack the case?', href: '/games/face-detective' },
      { id: 'face-detective-boss', name: 'Boss Battle: Expression Expert', emoji: '⚡🔍', desc: '8-round rapid-fire detective challenge.', href: '/games/face-detective?mode=boss' },
    ],
    knowledgeVault: [
      { emoji: '😄', fact: 'Happy faces have raised cheeks and turned-up mouth corners.' },
      { emoji: '😢', fact: 'Sad faces often have drooping eyes and a downturned mouth.' },
      { emoji: '😠', fact: 'Angry faces have lowered eyebrows and a tight jaw.' },
      { emoji: '😲', fact: 'Surprised faces have raised eyebrows and a wide-open mouth.' },
    ],
  },
};

export default function WorldPage() {
  const params = useParams();
  const worldId = params?.worldId as string;
  const world = WORLD_DATA[worldId];

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)]">
        <div className="text-center">
          <p className="text-5xl mb-4">🌍</p>
          <p className="font-heading font-bold text-xl">World not found</p>
          <Link href="/worlds" className="text-[var(--sv-primary-deep)] underline mt-2 block">Back to World Atlas</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/worlds" className="rounded-full p-2 bg-[var(--sv-card-tint)] hover:bg-[var(--sv-primary)]/10 transition" aria-label="Back to Atlas">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">{world.emoji} {world.name}</h1>
          </div>
        </div>

        {/* Lore card */}
        <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${world.color}dd, ${world.color}88)` }}>
          <p className="text-lg leading-relaxed font-medium">{world.lore}</p>
        </div>

        {/* Games */}
        <section>
          <h2 className="font-heading font-bold text-xl mb-3">🎮 Arcade</h2>
          <div className="space-y-3">
            {world.games.map((g) => (
              <Link
                key={g.id}
                href={g.href}
                className="flex items-center gap-4 p-4 bg-white/80 dark:bg-white/10 rounded-2xl border border-[var(--sv-primary)]/20 hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                <span className="text-4xl">{g.emoji}</span>
                <div className="flex-1">
                  <p className="font-heading font-bold text-[var(--sv-text)]">{g.name}</p>
                  <p className="text-sm text-[var(--sv-text-soft)]">{g.desc}</p>
                </div>
                <span className="text-[var(--sv-primary-deep)] font-bold text-lg">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Knowledge Vault */}
        <section>
          <h2 className="font-heading font-bold text-xl mb-3">📚 Knowledge Vault</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {world.knowledgeVault.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[var(--sv-card-tint)] rounded-2xl border border-[var(--sv-primary)]/10">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-sm text-[var(--sv-text)] leading-relaxed">{item.fact}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="pb-8">
          <Link href="/hub" className="text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] transition">
            ← Back to Hub
          </Link>
        </div>
      </div>
    </div>
  );
}

