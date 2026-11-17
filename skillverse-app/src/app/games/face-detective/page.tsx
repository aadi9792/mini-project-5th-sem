'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { economyClient } from '@/lib/economy/economyClient';
import { difficultyClient } from '@/lib/guardian/guardianClient';
import { useDifficultyProfile, Tier } from '@/lib/useDifficultyProfile';

type FaceScenario = {
  id: string;
  emoji: string;
  clue: string;
  answer: string;
  options: string[];
};

const EASY_FACES: FaceScenario[] = [
  { id: 'e1', emoji: '😄', clue: 'Wide smile, raised cheeks, bright eyes.', answer: 'Happy', options: ['Happy', 'Sad', 'Angry', 'Scared'] },
  { id: 'e2', emoji: '😢', clue: 'Tears running down, downturned mouth, droopy eyes.', answer: 'Sad', options: ['Happy', 'Sad', 'Excited', 'Calm'] },
  { id: 'e3', emoji: '😠', clue: 'Furrowed brows, tight jaw, clenched expression.', answer: 'Angry', options: ['Angry', 'Sad', 'Surprised', 'Happy'] },
  { id: 'e4', emoji: '😲', clue: 'Wide eyes, open mouth, raised eyebrows.', answer: 'Surprised', options: ['Surprised', 'Happy', 'Angry', 'Calm'] },
  { id: 'e5', emoji: '😌', clue: 'Soft eyes, gentle half-smile, relaxed face.', answer: 'Calm', options: ['Calm', 'Sad', 'Excited', 'Angry'] },
];

const MEDIUM_FACES: FaceScenario[] = [
  { id: 'm1', emoji: '😟', clue: 'Furrowed brows but soft, mouth pulled down at corners.', answer: 'Worried', options: ['Worried', 'Angry', 'Calm', 'Happy'] },
  { id: 'm2', emoji: '😒', clue: 'Lowered eyes, flat expression, slight frown.', answer: 'Bored', options: ['Bored', 'Sad', 'Calm', 'Annoyed'] },
  { id: 'm3', emoji: '😤', clue: 'Puffed out, raised brows, tight expression.', answer: 'Frustrated', options: ['Frustrated', 'Angry', 'Excited', 'Proud'] },
  { id: 'm4', emoji: '😳', clue: 'Red cheeks, wide eyes, surprised look.', answer: 'Embarrassed', options: ['Embarrassed', 'Surprised', 'Excited', 'Angry'] },
  { id: 'm5', emoji: '🤩', clue: 'Stars in the eyes, huge grin, beaming face.', answer: 'Excited', options: ['Excited', 'Happy', 'Surprised', 'Calm'] },
];

const HARD_FACES: FaceScenario[] = [
  { id: 'h1', emoji: '😶', clue: 'Blank, no smile or frown, eyes neutral, unmoving.', answer: 'Neutral', options: ['Neutral', 'Calm', 'Bored', 'Sad'] },
  { id: 'h2', emoji: '🥹', clue: 'Eyes glistening, soft smile, overwhelmed in a good way.', answer: 'Touched', options: ['Touched', 'Sad', 'Happy', 'Worried'] },
  { id: 'h3', emoji: '😏', clue: 'One corner lifted, knowing look, slightly smug.', answer: 'Smug', options: ['Smug', 'Happy', 'Bored', 'Annoyed'] },
  { id: 'h4', emoji: '🤔', clue: 'Eyes up and to side, hand on chin, thinking hard.', answer: 'Thinking', options: ['Thinking', 'Confused', 'Calm', 'Worried'] },
  { id: 'h5', emoji: '😬', clue: 'Teeth clenched, eyes wide, tense grimace.', answer: 'Nervous', options: ['Nervous', 'Excited', 'Angry', 'Surprised'] },
];

function getScenariosForTier(tier: Tier) {
  if (tier === 'easy') return EASY_FACES;
  if (tier === 'hard') return HARD_FACES;
  return MEDIUM_FACES;
}

function FaceDetectiveInner() {
  const searchParams = useSearchParams();
  const isBoss = searchParams?.get('mode') === 'boss';
  const totalRounds = isBoss ? 8 : 5;

  const [initialTier, setInitialTier] = useState<Tier>('medium');
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [scenarios, setScenarios] = useState<FaceScenario[]>([]);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<('strong' | 'struggle')[]>([]);
  const [rewardData, setRewardData] = useState<any>(null);
  const [companionLine, setCompanionLine] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const diff = useDifficultyProfile('face-detective', initialTier, isBoss);

  useEffect(() => {
    difficultyClient.getProfile('face-detective')
      .then((r) => setInitialTier(r.tier))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startGame = useCallback(() => {
    const pool = getScenariosForTier(diff.sessionTier);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    // For boss mode (8 rounds), cycle through the pool if needed
    const picked: FaceScenario[] = [];
    for (let i = 0; i < totalRounds; i++) picked.push(shuffled[i % shuffled.length]);
    setScenarios(picked);
    setRound(0); setResults([]); setPhase('playing');
  }, [diff.sessionTier, totalRounds]);

  useEffect(() => {
    if (diff.onTierChange) { setCompanionLine(diff.onTierChange); diff.clearTierChange(); }
  }, [diff.onTierChange]);

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt === scenarios[round].answer;
    const strong = isCorrect;
    setResults((r) => [...r, strong ? 'strong' : 'struggle']);
    if (strong) setStreak((s) => s + 1); else setStreak(0);
    if (!isBoss) diff.reportRoundResult(strong);
  };

  const nextRound = async () => {
    if (round + 1 >= totalRounds) {
      try {
        const reward = await economyClient.questComplete({ questType: 'GAME', gameId: 'face-detective', mode: isBoss ? 'boss' : 'normal', worldId: 'faces' });
        setRewardData(reward);
      } catch {}
      if (!isBoss) await diff.commitSession();
      setPhase('result');
    } else {
      setRound((r) => r + 1); setSelected(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)]"><div className="text-6xl animate-bounce">🔍</div></div>;

  const current = scenarios[round];
  const isCorrect = selected === current?.answer;

  return (
    <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/worlds/faces" className="text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)]">← Faces World</Link>
          <span className="font-heading font-bold text-lg">🔍 Face Detective {isBoss && '⚡'}</span>
          <span className="text-sm text-[var(--sv-text-soft)] bg-[var(--sv-card-tint)] px-3 py-1 rounded-full capitalize">{diff.sessionTier}</span>
        </div>

        {companionLine && (
          <div className="bg-[var(--sv-primary)]/10 border border-[var(--sv-primary)]/30 rounded-2xl p-3 text-center text-sm font-medium text-[var(--sv-primary-deep)]" aria-live="polite">
            🤖 {companionLine}
          </div>
        )}

        {phase === 'intro' && (
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 text-center space-y-4 border border-[var(--sv-primary)]/20">
            <span className="text-6xl">🔍</span>
            <h1 className="font-heading font-bold text-2xl">Face Detective {isBoss ? '— Boss Battle ⚡' : ''}</h1>
            <p className="text-[var(--sv-text-soft)]">Look at the emoji face and clue, then name the feeling!</p>
            <p className="text-sm font-semibold text-[var(--sv-primary-deep)] bg-[var(--sv-card-tint)] rounded-full px-4 py-1">Difficulty: {diff.sessionTier.toUpperCase()}</p>
            <button onClick={startGame} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-lg hover:opacity-90 transition">
              Start Investigating 🔍
            </button>
          </div>
        )}

        {phase === 'playing' && current && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalRounds }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < round ? (results[i] === 'strong' ? 'bg-[var(--sv-success)]' : 'bg-[var(--sv-warning)]') : i === round ? 'bg-[var(--sv-primary)]' : 'bg-[var(--sv-card-tint)]'}`} />
              ))}
            </div>
            <p className="text-xs text-[var(--sv-text-soft)] text-right">Case {round + 1} of {totalRounds}</p>

            {/* Face display */}
            <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 border border-[var(--sv-primary)]/20 text-center space-y-3">
              <span className="text-8xl block">{current.emoji}</span>
              <p className="text-sm text-[var(--sv-text-soft)] bg-[var(--sv-card-tint)] rounded-xl p-3 italic">
                🔎 Clue: {current.clue}
              </p>
              <p className="font-heading font-bold text-lg">What feeling is this?</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((opt) => {
                let cls = 'h-14 rounded-2xl font-semibold text-sm border-2 transition-all ';
                if (!selected) cls += 'bg-white/80 dark:bg-white/10 border-[var(--sv-primary)]/20 hover:border-[var(--sv-primary)] cursor-pointer';
                else if (opt === current.answer) cls += 'bg-[var(--sv-success)]/20 border-[var(--sv-success)] text-[var(--sv-success)]';
                else if (opt === selected) cls += 'bg-[var(--sv-warning)]/20 border-[var(--sv-warning)] text-[var(--sv-warning)]';
                else cls += 'bg-[var(--sv-card-tint)] border-transparent opacity-40';
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selected} className={cls}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="text-center space-y-3" aria-live="polite">
                <p className="font-heading font-bold text-xl">
                  {isCorrect ? '✅ Case Solved!' : '❌ Not quite…'}
                </p>
                {!isCorrect && <p className="text-sm text-[var(--sv-text-soft)]">This face shows: <strong>{current.answer}</strong></p>}
                {streak >= 3 && isCorrect && <p className="text-sm text-[var(--sv-primary-deep)] font-semibold">🔥 {streak} correct in a row!</p>}
                <button onClick={nextRound} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold hover:opacity-90 transition">
                  {round + 1 >= totalRounds ? 'See Results →' : 'Next Case →'}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 text-center space-y-4 border border-[var(--sv-primary)]/20">
            <span className="text-6xl">🎉</span>
            <h1 className="font-heading font-bold text-2xl">Detective Complete!</h1>
            <p className="text-[var(--sv-text-soft)]">
              Solved {results.filter((r) => r === 'strong').length} of {totalRounds} cases
            </p>
            <div className="flex justify-center gap-6">
              <div><p className="text-3xl font-bold text-[var(--sv-warning)]">+{rewardData?.starsAwarded ?? 3}⭐</p><p className="text-xs text-[var(--sv-text-soft)]">Stars</p></div>
              <div><p className="text-3xl font-bold text-[var(--sv-primary-deep)]">+{rewardData?.coinsAwarded ?? 2}🪙</p><p className="text-xs text-[var(--sv-text-soft)]">Coins</p></div>
            </div>
            {rewardData?.leveledUp && <p className="font-heading font-bold text-[var(--sv-primary-deep)] text-lg">🆙 Level Up! Level {rewardData.level}!</p>}
            {rewardData?.newlyEarnedBadges?.map((b: any) => <p key={b.id} className="font-bold text-[var(--sv-warning)]">🎖️ {b.displayName}</p>)}
            {rewardData?.newCollectible && <p className="font-bold">✨ {rewardData.newCollectible.emoji} {rewardData.newCollectible.displayName}</p>}
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

export default function FaceDetectivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)] text-[var(--sv-text)]">Loading Face Detective...</div>}>
      <FaceDetectiveInner />
    </Suspense>
  );
}

