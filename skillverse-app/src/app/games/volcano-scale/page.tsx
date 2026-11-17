'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { economyClient } from '@/lib/economy/economyClient';
import { difficultyClient } from '@/lib/guardian/guardianClient';
import { useDifficultyProfile, Tier } from '@/lib/useDifficultyProfile';

type Emotion = { label: string; emoji: string; easyIntensity: string; correctScale: number };

const EMOTIONS_EASY: Emotion[] = [
  { label: 'Happy', emoji: '😊', easyIntensity: 'warm and light', correctScale: 3 },
  { label: 'Sad', emoji: '😢', easyIntensity: 'heavy and slow', correctScale: 2 },
  { label: 'Calm', emoji: '😌', easyIntensity: 'quiet and still', correctScale: 1 },
  { label: 'Excited', emoji: '🤩', easyIntensity: 'bubbly and fast', correctScale: 4 },
  { label: 'Angry', emoji: '😠', easyIntensity: 'hot and big', correctScale: 5 },
];

const EMOTIONS_MEDIUM: Emotion[] = [
  { label: 'Frustrated', emoji: '😤', easyIntensity: 'tight and stuck', correctScale: 4 },
  { label: 'Worried', emoji: '😟', easyIntensity: 'shaky and fast', correctScale: 3 },
  { label: 'Surprised', emoji: '😲', easyIntensity: 'sudden jump', correctScale: 3 },
  { label: 'Disappointed', emoji: '😞', easyIntensity: 'low and sinking', correctScale: 2 },
  { label: 'Overwhelmed', emoji: '🤯', easyIntensity: 'too much, too loud', correctScale: 5 },
];

const EMOTIONS_HARD: Emotion[] = [
  { label: 'Embarrassed', emoji: '😳', easyIntensity: 'hot cheeks, want to hide', correctScale: 3 },
  { label: 'Jealous', emoji: '😒', easyIntensity: 'tight and wanting', correctScale: 3 },
  { label: 'Proud', emoji: '😤', easyIntensity: 'tall and bright', correctScale: 4 },
  { label: 'Lonely', emoji: '😶', easyIntensity: 'empty and quiet', correctScale: 2 },
  { label: 'Grateful', emoji: '🥹', easyIntensity: 'warm and full', correctScale: 2 },
];

const STRATEGIES = [
  { id: 'breathe', label: 'Take deep breaths', emoji: '🌬️' },
  { id: 'move', label: 'Go for a walk', emoji: '🚶' },
  { id: 'talk', label: 'Talk to someone', emoji: '💬' },
  { id: 'draw', label: 'Draw or colour', emoji: '🎨' },
];

function getEmotionsForTier(tier: Tier) {
  if (tier === 'easy') return EMOTIONS_EASY;
  if (tier === 'hard') return EMOTIONS_HARD;
  return EMOTIONS_MEDIUM;
}

function VolcanoScaleInner() {
  const searchParams = useSearchParams();
  const isBoss = searchParams?.get('mode') === 'boss';
  const totalRounds = isBoss ? 8 : 5;

  const [initialTier, setInitialTier] = useState<Tier>('medium');
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [round, setRound] = useState(0);
  const [selectedScale, setSelectedScale] = useState<number | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<('strong' | 'struggle')[]>([]);
  const [rewardData, setRewardData] = useState<any>(null);
  const [companionLine, setCompanionLine] = useState<string | null>(null);

  const diff = useDifficultyProfile('volcano-scale', initialTier, isBoss);

  useEffect(() => {
    difficultyClient.getProfile('volcano-scale')
      .then((r) => setInitialTier(r.tier))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startGame = useCallback(() => {
    const pool = getEmotionsForTier(diff.sessionTier);
    setEmotions([...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(totalRounds, pool.length)));
    setRound(0); setResults([]); setPhase('playing');
  }, [diff.sessionTier, totalRounds]);

  useEffect(() => {
    if (diff.onTierChange) { setCompanionLine(diff.onTierChange); diff.clearTierChange(); }
  }, [diff.onTierChange]);

  const submitAnswer = () => {
    if (selectedScale === null) return;
    const current = emotions[round];
    const diff2 = Math.abs(selectedScale - current.correctScale);
    const isAccurate = diff2 <= 1;
    const strong = isAccurate;
    setResults((r) => [...r, strong ? 'strong' : 'struggle']);
    if (!isBoss) diff.reportRoundResult(strong);
    setAnswered(true);
  };

  const nextRound = async () => {
    if (round + 1 >= totalRounds) {
      try {
        const reward = await economyClient.questComplete({ questType: 'GAME', gameId: 'volcano-scale', mode: isBoss ? 'boss' : 'normal', worldId: 'feelings' });
        setRewardData(reward);
      } catch {}
      if (!isBoss) await diff.commitSession();
      setPhase('result');
    } else {
      setRound((r) => r + 1);
      setSelectedScale(null);
      setSelectedStrategy(null);
      setAnswered(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)]"><div className="text-6xl animate-bounce">🌋</div></div>;

  const current = emotions[round];
  const volcanoHeight = selectedScale ? `${selectedScale * 20}%` : '10%';

  return (
    <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/worlds/feelings" className="text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)]">← Feelings World</Link>
          <span className="font-heading font-bold text-lg">🌋 Calm the Volcano {isBoss && '⚡'}</span>
          <span className="text-sm text-[var(--sv-text-soft)] bg-[var(--sv-card-tint)] px-3 py-1 rounded-full capitalize">{diff.sessionTier}</span>
        </div>

        {companionLine && (
          <div className="bg-[var(--sv-primary)]/10 border border-[var(--sv-primary)]/30 rounded-2xl p-3 text-center text-sm font-medium text-[var(--sv-primary-deep)]" aria-live="polite">
            🤖 {companionLine}
          </div>
        )}

        {phase === 'intro' && (
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 text-center space-y-4 border border-[var(--sv-primary)]/20">
            <span className="text-6xl">🌋</span>
            <h1 className="font-heading font-bold text-2xl">Calm the Volcano {isBoss ? '— Boss Battle ⚡' : ''}</h1>
            <p className="text-[var(--sv-text-soft)]">Rate how intense each feeling is on a scale of 1–5. Then choose a strategy!</p>
            <p className="text-sm font-semibold text-[var(--sv-primary-deep)] bg-[var(--sv-card-tint)] rounded-full px-4 py-1">Difficulty: {diff.sessionTier.toUpperCase()}</p>
            <button onClick={startGame} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-lg hover:opacity-90 transition">
              Start 🌋
            </button>
          </div>
        )}

        {phase === 'playing' && current && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalRounds }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < round ? 'bg-[var(--sv-success)]' : i === round ? 'bg-[var(--sv-primary)]' : 'bg-[var(--sv-card-tint)]'}`} />
              ))}
            </div>

            <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-6 border border-[var(--sv-primary)]/20 text-center space-y-2">
              <span className="text-5xl">{current.emoji}</span>
              <h2 className="font-heading font-bold text-xl">{current.label}</h2>
              <p className="text-sm text-[var(--sv-text-soft)]">This feeling feels {current.easyIntensity}.</p>
              <p className="font-medium text-[var(--sv-text)]">How BIG is this feeling? Rate 1 (tiny) to 5 (huge volcano!)</p>
            </div>

            {/* Volcano visual */}
            <div className="relative h-32 flex items-end justify-center">
              <div className="relative w-32">
                <div className="w-0 h-0 border-l-[64px] border-r-[64px] border-b-[80px] border-l-transparent border-r-transparent border-b-gray-400/30 dark:border-b-gray-600/30" />
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 rounded-t transition-all duration-500"
                  style={{ height: volcanoHeight, background: 'linear-gradient(to top, #ef4444, #f97316)' }}
                />
              </div>
            </div>

            {/* Scale buttons */}
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => !answered && setSelectedScale(n)}
                  disabled={answered}
                  className={`w-12 h-12 rounded-full font-bold text-lg border-2 transition-all ${
                    selectedScale === n
                      ? 'bg-[var(--sv-primary-deep)] text-white border-[var(--sv-primary-deep)] scale-110'
                      : 'bg-white/80 dark:bg-white/10 border-[var(--sv-primary)]/20 hover:border-[var(--sv-primary)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Strategy selection (always shown, unscored) */}
            {!answered && selectedScale && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-center text-[var(--sv-text-soft)]">Pick a strategy that might help:</p>
                <div className="grid grid-cols-2 gap-2">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStrategy(s.id)}
                      className={`p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                        selectedStrategy === s.id
                          ? 'border-[var(--sv-primary-deep)] bg-[var(--sv-primary)]/10'
                          : 'border-[var(--sv-primary)]/20 bg-white/80 dark:bg-white/10 hover:border-[var(--sv-primary)]'
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <button onClick={submitAnswer} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold hover:opacity-90 transition">
                    Submit ✓
                  </button>
                </div>
              </div>
            )}

            {answered && (
              <div className="text-center space-y-3" aria-live="polite">
                {(() => {
                  const diff2 = Math.abs((selectedScale ?? 0) - current.correctScale);
                  return (
                    <>
                      <p className="font-heading font-bold text-xl">
                        {diff2 === 0 ? '🎯 Spot on!' : diff2 === 1 ? '✨ Close match!' : '🌋 Interesting choice!'}
                      </p>
                      <p className="text-sm text-[var(--sv-text-soft)]">
                        A common rating for {current.label} is <strong>{current.correctScale}</strong>.
                        {selectedStrategy && ` ${STRATEGIES.find((s) => s.id === selectedStrategy)?.emoji} ${STRATEGIES.find((s) => s.id === selectedStrategy)?.label} is a great strategy!`}
                      </p>
                    </>
                  );
                })()}
                <button onClick={nextRound} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold hover:opacity-90 transition">
                  {round + 1 >= totalRounds ? 'See Results →' : 'Next Round →'}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 text-center space-y-4 border border-[var(--sv-primary)]/20">
            <span className="text-6xl">🌟</span>
            <h1 className="font-heading font-bold text-2xl">Volcano Calmed!</h1>
            <div className="flex justify-center gap-6">
              <div><p className="text-3xl font-bold text-[var(--sv-warning)]">+{rewardData?.starsAwarded ?? 3}⭐</p><p className="text-xs text-[var(--sv-text-soft)]">Stars</p></div>
              <div><p className="text-3xl font-bold text-[var(--sv-primary-deep)]">+{rewardData?.coinsAwarded ?? 2}🪙</p><p className="text-xs text-[var(--sv-text-soft)]">Coins</p></div>
            </div>
            {rewardData?.leveledUp && <p className="font-heading font-bold text-[var(--sv-primary-deep)] text-lg">🆙 Level Up! Level {rewardData.level}!</p>}
            {rewardData?.newlyEarnedBadges?.map((b: any) => <p key={b.id} className="font-bold text-[var(--sv-warning)]">🎖️ {b.displayName}</p>)}
            {rewardData?.newCollectible && <p className="font-bold">✨ {rewardData.newCollectible.emoji} {rewardData.newCollectible.displayName} collected!</p>}
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setPhase('intro'); setRewardData(null); }} className="h-12 px-6 rounded-full border-2 border-[var(--sv-primary-deep)] text-[var(--sv-primary-deep)] font-bold hover:bg-[var(--sv-primary-deep)] hover:text-white transition">
                Play Again
              </button>
              <Link href="/hub" className="h-12 px-6 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold flex items-center hover:opacity-90 transition">
                Back to Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VolcanoScalePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)] text-[var(--sv-text)]">Loading Volcano Scale...</div>}>
      <VolcanoScaleInner />
    </Suspense>
  );
}
