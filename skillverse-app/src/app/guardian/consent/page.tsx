'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, Shield } from 'lucide-react';
import ParentGateModal from '@/components/ParentGateModal';
import { guardianClient } from '@/lib/guardian/guardianClient';
import { useRouter } from 'next/navigation';

export default function ConsentPage() {
  const router = useRouter();
  const [showGate, setShowGate] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [showDeleteGate, setShowDeleteGate] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [nickname, setNickname] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load nickname for confirm phrase
  const loadNickname = async () => {
    try {
      const r = await fetch('http://localhost:4000/api/v1/children/me', { credentials: 'include' }).then((res) => res.json());
      setNickname(r.nickname ?? '');
    } catch {}
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await guardianClient.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'skillverse-export.json'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  };

  const handleDelete = async () => {
    if (!nickname) return;
    const expected = `delete ${nickname}'s account`;
    setDeleting(true); setDeleteError('');
    try {
      const res = await guardianClient.deleteAccount(confirmPhrase);
      if (res === null || res?.deleted) {
        router.push('/login');
      } else {
        setDeleteError(`Please type exactly: "${expected}"`);
      }
    } catch {
      setDeleteError(`Please type exactly: "${expected}"`);
    }
    setDeleting(false);
  };

  if (showGate) {
    return <ParentGateModal intent="view" onSuccess={() => { setShowGate(false); loadNickname(); }} onCancel={() => router.push('/guardian/dashboard')} />;
  }

  if (showDeleteGate) {
    return <ParentGateModal intent="action" onSuccess={() => { setShowDeleteGate(false); setShowDeleteFlow(true); }} onCancel={() => setShowDeleteGate(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/guardian/dashboard" className="rounded-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 transition" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading font-bold text-2xl flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-600" /> Consent Center</h1>
        </div>

        {/* What we store */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <h2 className="font-heading font-bold text-lg">📋 What We Store</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside">
            <li><strong>Account info</strong> — name, email, verification status</li>
            <li><strong>Child profile</strong> — nickname, age, avatar, preferences (12 questions)</li>
            <li><strong>Companion</strong> — adopted companions, custom names</li>
            <li><strong>Zone check-ins</strong> — emotional state logs</li>
            <li><strong>Game progress</strong> — sessions, difficulty profiles, quest completions</li>
            <li><strong>Rewards</strong> — stars, coins, badges, collectibles, shop items</li>
            <li><strong>Real-life quests</strong> — guardian-authored daily plans</li>
            <li><strong>Play sessions</strong> — session durations (screen time)</li>
          </ul>
          <p className="text-xs text-gray-400">Need to fix something? <Link href="/guardian/profile" className="underline text-indigo-600">Edit it in Profile Control →</Link></p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-300">
            ⚠️ This is a placeholder consent text. Not a final legal agreement.
          </div>
        </div>

        {/* Export */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
          <h2 className="font-heading font-bold text-lg">📥 Export My Data</h2>
          <p className="text-sm text-gray-500">Download all your data as a JSON file. Password-hashes and security tokens are not included.</p>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 h-11 px-5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Download My Data'}
          </button>
        </div>

        {/* Delete */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-red-200 dark:border-red-800 space-y-3">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5" /> Delete My Account</h2>
          <p className="text-sm text-gray-500">This permanently deletes all data for your account and {nickname ? `${nickname}'s` : "your child's"} profile. This cannot be undone.</p>

          {!showDeleteFlow ? (
            <button onClick={() => setShowDeleteGate(true)} className="flex items-center gap-2 h-11 px-5 rounded-xl border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Type exactly: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-red-600">delete {nickname}'s account</code>
              </p>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder={`delete ${nickname}'s account`}
                className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm"
              />
              {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
              <button
                onClick={handleDelete}
                disabled={deleting || confirmPhrase !== `delete ${nickname}'s account`}
                className="h-11 px-6 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button onClick={() => setShowDeleteFlow(false)} className="text-sm text-gray-500 hover:text-gray-700 ml-3">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

