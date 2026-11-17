'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import ParentGateModal from '@/components/ParentGateModal';
import { ThemePicker } from '@/components/ThemePicker';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:4000/api/v1';

const Q4_OPTIONS = [
  { value: 'under_3', label: 'Under 3 minutes' },
  { value: '3_to_7', label: '3–7 minutes' },
  { value: '7_to_15', label: '7–15 minutes' },
  { value: '15_plus', label: '15+ minutes' },
];
const Q9_OPTIONS = [
  { value: 'independent', label: 'Works independently' },
  { value: 'a_few_prompts', label: 'Needs a few prompts' },
  { value: 'step_by_step', label: 'Needs step-by-step guidance' },
];
const Q7_OPTIONS = [
  { value: 'gentle_checkins', label: 'Gentle check-ins are helpful' },
  { value: 'only_when_asked', label: 'Prefers check-ins only when asked' },
];

export default function ProfileControlPage() {
  const router = useRouter();
  const [showGate, setShowGate] = useState(true);
  const [child, setChild] = useState<any>(null);
  const [prefs, setPrefs] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [childRes, prefsRes] = await Promise.all([
        fetch(`${API}/children/me`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${API}/children/me/preferences`, { credentials: 'include' }).then((r) => r.json()),
      ]);
      setChild(childRes);
      setPrefs(prefsRes);
      setNickname(childRes.nickname ?? '');
      setAge(String(childRes.age ?? ''));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (!showGate) load(); }, [showGate]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      // Update child profile (nickname, age)
      await fetch(`${API}/children/me`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), age: Number(age) }),
      });

      // Update preferences if changed
      if (prefs) {
        await fetch(`${API}/children/me/preferences`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q4AttentionSpan: prefs.q4AttentionSpan,
            q9GuidanceNeeded: prefs.q9GuidanceNeeded,
            q7CheckInStyle: prefs.q7CheckInStyle,
          }),
        });
      }
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  if (showGate) {
    return <ParentGateModal intent="view" onSuccess={() => setShowGate(false)} onCancel={() => router.push('/guardian/dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/guardian/dashboard" className="rounded-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading font-bold text-2xl">⚙️ Profile & Theme</h1>
        </div>

        {loading ? <div className="text-center py-10 text-gray-400">Loading…</div> : (
          <div className="space-y-5">
            {/* Basic info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
              <h2 className="font-heading font-bold text-lg">👤 Basic Info</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Nickname</span>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-1 block w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Age</span>
                  <input type="number" min={3} max={18} value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 block w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm" />
                </label>
              </div>
            </div>

            {/* Preferences */}
            {prefs && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
                <h2 className="font-heading font-bold text-lg">🧠 Preferences</h2>

                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Attention span (Q4)</p>
                  <div className="flex flex-wrap gap-2">
                    {Q4_OPTIONS.map((o) => (
                      <button key={o.value} onClick={() => setPrefs({ ...prefs, q4AttentionSpan: o.value })}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${prefs.q4AttentionSpan === o.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-gray-200 dark:border-gray-600'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Guidance needed (Q9)</p>
                  <div className="flex flex-wrap gap-2">
                    {Q9_OPTIONS.map((o) => (
                      <button key={o.value} onClick={() => setPrefs({ ...prefs, q9GuidanceNeeded: o.value })}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${prefs.q9GuidanceNeeded === o.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-gray-200 dark:border-gray-600'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Check-in style (Q7)</p>
                  <div className="flex flex-wrap gap-2">
                    {Q7_OPTIONS.map((o) => (
                      <button key={o.value} onClick={() => setPrefs({ ...prefs, q7CheckInStyle: o.value })}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${prefs.q7CheckInStyle === o.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-gray-200 dark:border-gray-600'}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
              <h2 className="font-heading font-bold text-lg">🎨 Theme</h2>
              <p className="text-sm text-gray-500">Current theme: <strong className="capitalize">{child?.preferredTheme ?? 'space'}</strong></p>
              <button onClick={() => setShowThemePicker(!showThemePicker)} className="h-10 px-5 rounded-xl border-2 border-indigo-500 text-indigo-600 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
                Change Theme
              </button>
              {showThemePicker && <ThemePicker onThemeSelected={() => { setShowThemePicker(false); load(); }} />}
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving} className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && <p className="text-sm text-green-600 font-semibold" aria-live="polite">✅ Changes saved!</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
