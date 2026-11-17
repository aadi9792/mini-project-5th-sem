'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { economyClient } from '@/lib/economy/economyClient';
import { difficultyClient } from '@/lib/guardian/guardianClient';
import { useDifficultyProfile, Tier } from '@/lib/useDifficultyProfile';

// ── Scenario banks per tier ───────────────────────────────────────────────────
type TimeScenario = { id: string; question: string; answer: string; options: string[]; hint: string };

const EASY_SCENARIOS: TimeScenario[] = [
  { id: 'e1', question: 'The rocket launches at 2:00. What time is that on a clock?', answer: '2:00', options: ['1:00', '2:00', '3:00', '4:00'], hint: 'Look for the short hand pointing to 2.' },
  { id: 'e2', question: 'Which comes FIRST in the morning: breakfast or dinner?', answer: 'breakfast', options: ['breakfast', 'dinner', 'lunch', 'snack'], hint: 'Think about when the sun comes up.' },
  { id: 'e3', question: 'The countdown says 5 minutes. How many seconds is that?', answer: '300', options: ['60', '120', '300', '500'], hint: '1 minute = 60 seconds, so 5 × 60 = ?' },
  { id: 'e4', question: 'If it is 9:00 AM and 1 hour passes, what time is it?', answer: '10:00 AM', options: ['9:30 AM', '10:00 AM', '11:00 AM', '8:00 AM'], hint: 'Count one hour forward from 9.' },
  { id: 'e5', question: 'Which comes AFTER school: homework or waking up?', answer: 'homework', options: ['waking up', 'homework', 'breakfast', 'brushing teeth'], hint: 'You come home from school, then do what?' },
];

const MEDIUM_SCENARIOS: TimeScenario[] = [
  { id: 'm1', question: 'Launch window: 3:45 PM. Right now it is 3:30 PM. How many minutes until launch?', answer: '15', options: ['10', '15', '20', '30'], hint: 'Count from 3:30 to 3:45.' },
  { id: 'm2', question: 'The mission takes 2 hours 30 minutes. It starts at 1:00 PM. When does it end?', answer: '3:30 PM', options: ['2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'], hint: 'Add 2 hours, then 30 minutes.' },
  { id: 'm3', question: 'Put in order: Dinner → Bedtime → Lunch → School. What is the THIRD step?', answer: 'Dinner', options: ['Lunch', 'School', 'Dinner', 'Bedtime'], hint: 'Sort them by time of day: Lunch, School, Dinner, Bedtime.' },
  { id: 'm4', question: 'A rocket fuels for 45 minutes starting at 2:15. When is fueling done?', answer: '3:00', options: ['2:45', '3:00', '3:15', '2:30'], hint: '15 + 45 = 60 minutes = 1 hour past 2:00.' },
  { id: 'm5', question: 'It is 7:50 AM. School starts at 8:00 AM. How many minutes left?', answer: '10', options: ['5', '10', '15', '20'], hint: 'Count from 7:50 to 8:00.' },
];

const HARD_SCENARIOS: TimeScenario[] = [
  { id: 'h1', question: 'Mission departs 11:45 AM. Travel takes 3h 20m. Arrival time?', answer: '3:05 PM', options: ['2:45 PM', '3:00 PM', '3:05 PM', '3:15 PM'], hint: '11:45 + 3h = 2:45 PM, then +20m = 3:05 PM.' },
  { id: 'h2', question: 'You need 8 hours of sleep. Bedtime is 9:30 PM. When do you wake up?', answer: '5:30 AM', options: ['4:30 AM', '5:00 AM', '5:30 AM', '6:00 AM'], hint: '9:30 PM + 8h crosses midnight to 5:30 AM.' },
  { id: 'h3', question: 'A countdown runs from T-90 to T-0. If it is at T-37, how many minutes remain?', answer: '37', options: ['37', '53', '90', '127'], hint: 'T-37 means 37 minutes until zero.' },
  { id: 'h4', question: 'Flight leaves at 06:15. Check-in closes 2h before. When does check-in close?', answer: '4:15 AM', options: ['3:15 AM', '4:00 AM', '4:15 AM', '4:30 AM'], hint: 'Subtract 2 hours from 06:15.' },
  { id: 'h5', question: 'On a 12-hour clock, 15:30 is written as…?', answer: '3:30 PM', options: ['3:30 AM', '3:30 PM', '2:30 PM', '12:30 PM'], hint: '15 − 12 = 3, so 3:30 PM.' },
];

function getScenariosForTier(tier: Tier): TimeScenario[] {
  if (tier === 'easy') return EASY_SCENARIOS;
  if (tier === 'hard') return HARD_SCENARIOS;
  return MEDIUM_SCENARIOS;
}

function shuffleAndPick(arr: TimeScenario[], n: number): TimeScenario[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

type Outcome = 'perfect' | 'great' | 'nice-try' | null;

function LaunchChallengeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBoss = searchParams?.get('mode') === 'boss';
  const totalRounds = isBoss ? 8 : 5;

  const [initialTier, setInitialTier] = useState<Tier>('medium');
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [scenarios, setScenarios] = useState<TimeScenario[]>([]);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [streak, setStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<('strong' | 'struggle')[]>([]);
  const [rewardData, setRewardData] = useState<any>(null);
  const [companionLine, setCompanionLine] = useState<string | null>(null);

  const diff = useDifficultyProfile('launch-challenge', initialTier, isBoss);

  useEffect(() => {
    difficultyClient.getProfile('launch-challenge')
      .then((r) => setInitialTier(r.tier))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startGame = useCallback(() => {
    const pool = getScenariosForTier(diff.sessionTier);
    setScenarios(shuffleAndPick(pool, totalRounds));
    setRound(0);
    setResults([]);
    setPhase('playing');
  }, [diff.sessionTier, totalRounds]);

  useEffect(() => {
    if (diff.onTierChange) {
      setCompanionLine(diff.onTierChange);
      diff.clearTierChange();
      // Refresh scenarios for new tier
      const newPool = getScenariosForTier(diff.sessionTier);
      setScenarios((prev) => {
        const remaining = totalRounds - round;
        const fresh = shuffleAndPick(newPool, remaining);
        return [...prev.slice(0, round), ...fresh];
      });
    }
  }, [diff.onTierChange]);

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const current = scenarios[round];
    const isCorrect = opt === current.answer;
    // Perfect = correct on first try without hint, Great = correct with hint, Nice-try = wrong
    const o: Outcome = isCorrect ? (hintsUsed ? 'great' : 'perfect') : 'nice-try';
    setOutcome(o);
    const strong = o !== 'nice-try';
    setResults((r) => [...r, strong ? 'strong' : 'struggle']);
    if (strong) setStreak((s) => s + 1); else setStreak(0);
    if (!isBoss) diff.reportRoundResult(strong);
  };

  const nextRound = async () => {
    if (round + 1 >= totalRounds) {
      // Session complete
      const strongCount = results.filter((r) => r === 'strong').length + (outcome !== 'nice-try' ? 1 : 0);
      const mode = isBoss ? 'boss' : 'normal';
      try {
        const reward = await economyClient.questComplete({ questType: 'GAME', gameId: 'launch-challenge', mode, worldId: 'time' });
        setRewardData(reward);
      } catch {}
      if (!isBoss) await diff.commitSession();
      setPhase('result');
    } else {
      setRound((r) => r + 1);
      setSelected(null);
      setOutcome(null);
      setHintsUsed(false);
      setShowHint(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)]"><div className="text-6xl animate-bounce">🚀</div></div>;

  const current = scenarios[round];

  return (
    <div className="min-h-screen bg-[var(--sv-bg)] text-[var(--sv-text)] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/worlds/time" className="text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)]">← Time World</Link>
          <span className="font-heading font-bold text-lg">🚀 Launch Challenge {isBoss && '⚡'}</span>
          <span className="text-sm text-[var(--sv-text-soft)] bg-[var(--sv-card-tint)] px-3 py-1 rounded-full capitalize">{diff.sessionTier}</span>
        </div>

        {/* Companion line */}
        {companionLine && (
          <div className="bg-[var(--sv-primary)]/10 border border-[var(--sv-primary)]/30 rounded-2xl p-3 text-center text-sm font-medium text-[var(--sv-primary-deep)]" aria-live="polite">
            🤖 {companionLine}
          </div>
        )}

        {phase === 'intro' && (
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 text-center space-y-4 border border-[var(--sv-primary)]/20">
            <span className="text-6xl">🚀</span>
            <h1 className="font-heading font-bold text-2xl">Launch Challenge {isBoss ? '— Boss Battle ⚡' : ''}</h1>
            <p className="text-[var(--sv-text-soft)]">
              {isBoss ? 'All 8 rounds, no breaks! Show off your time skills!' : `${totalRounds} rounds of time puzzles. Ready for launch?`}
            </p>
            <p className="text-sm font-semibold text-[var(--sv-primary-deep)] bg-[var(--sv-card-tint)] rounded-full px-4 py-1">
              Difficulty: {diff.sessionTier.toUpperCase()}
            </p>
            <button onClick={startGame} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold text-lg hover:opacity-90 transition">
              Start Mission 🚀
            </button>
          </div>
        )}

        {phase === 'playing' && current && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalRounds }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < round ? 'bg-[var(--sv-success)]' : i === round ? 'bg-[var(--sv-primary)]' : 'bg-[var(--sv-card-tint)]'}`} />
              ))}
            </div>
            <p className="text-xs text-[var(--sv-text-soft)] text-right">Round {round + 1} of {totalRounds}</p>

            {/* Question */}
            <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-6 border border-[var(--sv-primary)]/20">
              <p className="font-heading font-bold text-lg leading-relaxed">{current.question}</p>
              {showHint && <p className="mt-3 text-sm text-[var(--sv-primary-deep)] bg-[var(--sv-primary)]/10 rounded-xl p-3">💡 {current.hint}</p>}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((opt) => {
                const isSelected = selected === opt;
                const isCorrect = opt === current.answer;
                let cls = 'h-14 rounded-2xl font-semibold text-sm border-2 transition-all ';
                if (!selected) cls += 'bg-white/80 dark:bg-white/10 border-[var(--sv-primary)]/20 hover:border-[var(--sv-primary)] hover:bg-[var(--sv-primary)]/5 cursor-pointer';
                else if (isCorrect) cls += 'bg-[var(--sv-success)]/20 border-[var(--sv-success)] text-[var(--sv-success)]';
                else if (isSelected) cls += 'bg-[var(--sv-warning)]/20 border-[var(--sv-warning)] text-[var(--sv-warning)]';
                else cls += 'bg-[var(--sv-card-tint)] border-transparent opacity-50';
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selected} className={cls}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* After answer */}
            {outcome && (
              <div className="text-center space-y-3" aria-live="polite">
                <p className="font-heading font-bold text-xl">
                  {outcome === 'perfect' ? '🌟 Perfect Launch!' : outcome === 'great' ? '✨ Great Launch!' : '🙁 Nice try!'}
                </p>
                {outcome === 'nice-try' && <p className="text-sm text-[var(--sv-text-soft)]">Correct answer: <strong>{current.answer}</strong></p>}
                {streak >= 3 && outcome !== 'nice-try' && <p className="text-sm text-[var(--sv-primary-deep)] font-semibold">🔥 {streak} in a row!</p>}
                <button onClick={nextRound} className="h-12 px-8 rounded-full bg-[var(--sv-primary-deep)] text-white font-bold hover:opacity-90 transition">
                  {round + 1 >= totalRounds ? 'See Results →' : 'Next Round →'}
                </button>
              </div>
            )}

            {/* Hint button */}
            {!selected && !showHint && (
              <div className="text-center">
                <button onClick={() => { setShowHint(true); setHintsUsed(true); }} className="text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-primary-deep)] underline">
                  Need a hint? 💡
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="bg-white/80 dark:bg-white/10 rounded-2xl p-8 text-center space-y-4 border border-[var(--sv-primary)]/20">
            <span className="text-6xl">🎉</span>
            <h1 className="font-heading font-bold text-2xl">Mission Complete!</h1>
            <div className="flex justify-center gap-6 text-lg">
              <div><p className="text-3xl font-bold text-[var(--sv-warning)]">+{rewardData?.starsAwarded ?? 3}⭐</p><p className="text-xs text-[var(--sv-text-soft)]">Stars</p></div>
              <div><p className="text-3xl font-bold text-[var(--sv-primary-deep)]">+{rewardData?.coinsAwarded ?? 2}🪙</p><p className="text-xs text-[var(--sv-text-soft)]">Coins</p></div>
            </div>
            {rewardData?.leveledUp && <p className="font-heading font-bold text-[var(--sv-primary-deep)] text-lg">🆙 Level Up! You're now Level {rewardData.level}!</p>}
            {rewardData?.newlyEarnedBadges?.length > 0 && (
              <div className="bg-[var(--sv-warning)]/10 border border-[var(--sv-warning)]/30 rounded-2xl p-3">
                <p className="font-bold">🎖️ New Badges!</p>
                {rewardData.newlyEarnedBadges.map((b: any) => <p key={b.id}>{b.emoji} {b.displayName}</p>)}
              </div>
            )}
            {rewardData?.newCollectible && (
              <div className="bg-[var(--sv-secondary)]/10 border border-[var(--sv-secondary)]/30 rounded-2xl p-3">
                <p className="font-bold">✨ Collectible Found!</p>
                <p>{rewardData.newCollectible.emoji} {rewardData.newCollectible.displayName}</p>
              </div>
            )}
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

export default function LaunchChallengePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--sv-bg)] text-[var(--sv-text)]">Loading Launch Challenge...</div>}>
      <LaunchChallengeInner />
    </Suspense>
  );
}
