'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import ParentGateModal from '@/components/ParentGateModal';
import { journeyClient } from '@/lib/guardian/guardianClient';
import { useRouter } from 'next/navigation';

interface Quest {
  id: string;
  label: string;
  emoji: string;
  rewardStars: number;
  rewardCoins: number;
  completed: boolean;
  orderIndex: number;
}

interface Template {
  id: string;
  label: string;
  emoji: string;
}

const CURATED_EMOJIS = ['🌅', '📚', '🍽️', '🛁', '🌙', '🏃', '🎨', '🧹', '🐕', '🌱', '⭐', '🎵', '🧸', '💪', '🌟'];

export default function QuestControlPage() {
  const router = useRouter();
  const [showGate, setShowGate] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('⭐');
  const [newStars, setNewStars] = useState(10);
  const [newCoins, setNewCoins] = useState(5);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const loadQuests = async () => {
    setLoading(true);
    try {
      const data = await journeyClient.getQuestsForDate(dateStr);
      setQuests(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const data = await journeyClient.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    if (!showGate) { loadQuests(); loadTemplates(); }
  }, [showGate, dateStr]);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await journeyClient.createQuest({
        templateId: selectedTemplate,
        label: newLabel.trim(),
        emoji: newEmoji,
        scheduledFor: dateStr,
        rewardStars: newStars,
        rewardCoins: newCoins,
      });
      setNewLabel(''); setNewEmoji('⭐'); setNewStars(10); setNewCoins(5); setSelectedTemplate(null); setShowAdd(false);
      await loadQuests();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quest?')) return;
    try {
      await journeyClient.deleteQuest(id);
      await loadQuests();
    } catch (e: any) {
      alert(e?.message ?? 'Cannot delete a completed quest.');
    }
  };

  const handleRepeatYesterday = async () => {
    setSaving(true);
    try {
      await journeyClient.repeatYesterday(dateStr);
      await loadQuests();
    } catch {}
    setSaving(false);
  };

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const newOrder = [...quests];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(i, 0, moved);
    setQuests(newOrder);
    setDragIdx(i);
  };
  const handleDrop = async () => {
    if (dragIdx === null) return;
    setDragIdx(null);
    try {
      await journeyClient.reorderQuests(dateStr, quests.map((q) => q.id));
    } catch {}
  };

  const pickTemplate = (t: Template) => {
    setNewLabel(t.label);
    setNewEmoji(t.emoji);
    setSelectedTemplate(t.id);
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
          <h1 className="font-heading font-bold text-2xl">📅 Quest Control</h1>
        </div>

        {/* Date picker + repeat yesterday */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm"
          />
          <button onClick={handleRepeatYesterday} disabled={saving} className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50">
            📋 Repeat Yesterday
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Quest
          </button>
        </div>

        {/* Add quest form */}
        {showAdd && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-lg">New Quest</h3>

            {/* Templates */}
            {templates.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Quick templates:</p>
                <div className="flex gap-2 flex-wrap">
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => pickTemplate(t)} className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${selectedTemplate === t.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <div className="relative">
                <span className="text-2xl cursor-pointer">{newEmoji}</span>
                <select className="absolute inset-0 opacity-0 cursor-pointer text-xs" onChange={(e) => setNewEmoji(e.target.value)}>
                  {CURATED_EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="Quest label…"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm"
              />
            </div>

            <div className="flex gap-4 items-center text-sm flex-wrap">
              <label className="flex items-center gap-2">
                ⭐ Stars:
                <input type="number" min={5} max={50} value={newStars} onChange={(e) => setNewStars(Number(e.target.value))} className="w-16 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 text-center" />
              </label>
              <label className="flex items-center gap-2">
                🪙 Coins:
                <input type="number" min={0} max={25} value={newCoins} onChange={(e) => setNewCoins(Number(e.target.value))} className="w-16 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 text-center" />
              </label>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={!newLabel.trim() || saving} className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Add Quest'}
              </button>
              <button onClick={() => setShowAdd(false)} className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quest list */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading quests…</div>
        ) : quests.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold">No quests for this day</p>
            <p className="text-sm mt-1">Use "Add Quest" or "Repeat Yesterday" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quests.map((q, i) => (
              <div
                key={q.id}
                draggable={!q.completed}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={handleDrop}
                className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border ${dragIdx === i ? 'border-indigo-400' : 'border-gray-200 dark:border-gray-700'} transition`}
              >
                {!q.completed && <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />}
                <span className="text-2xl">{q.emoji}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${q.completed ? 'line-through text-gray-400' : ''}`}>{q.label}</p>
                  <p className="text-xs text-gray-400">⭐ {q.rewardStars} · 🪙 {q.rewardCoins}</p>
                </div>
                {q.completed ? (
                  <span className="text-green-500 font-bold">✓</span>
                ) : (
                  <button onClick={() => handleDelete(q.id)} className="rounded-full p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition" aria-label="Delete quest">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

