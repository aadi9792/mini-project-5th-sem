'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { guardianClient } from '@/lib/guardian/guardianClient';
import { useGuardianToken } from '@/lib/guardian/GuardianTokenContext';

interface ParentGateModalProps {
  intent: 'view' | 'action';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ParentGateModal({ intent, onSuccess, onCancel }: ParentGateModalProps) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useGuardianToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await guardianClient.verifyPassword(password, intent);
      setToken(res.guardianActionToken, res.tier);
      onSuccess();
    } catch (err: any) {
      if (err?.status === 401 && (err?.message?.includes('Authentication') || err?.message?.includes('session') || err?.message?.includes('expired'))) {
        setError('Your login session has expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        setError(err?.message || 'Incorrect password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-[var(--sv-primary)]/20 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="gate-title" className="font-heading font-bold text-xl">Just checking it's you</h2>
            <p className="text-sm text-[var(--sv-text-soft)] mt-1">Enter your password to view the Guardian Dashboard.</p>
          </div>
          <button onClick={onCancel} className="rounded-full p-1 hover:bg-[var(--sv-card-tint)] transition" aria-label="Cancel">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-[var(--sv-primary)]/20 bg-[var(--sv-card-tint)] px-4 pr-11 text-[var(--sv-text)] focus:outline-none focus:border-[var(--sv-primary)] transition"
              autoFocus
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-[var(--sv-text-soft)] hover:text-[var(--sv-text)]" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

          <button type="submit" disabled={loading || !password} className="w-full h-12 rounded-xl bg-[var(--sv-primary-deep)] text-white font-bold hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Checking…' : 'Continue'}
          </button>
          <button type="button" onClick={onCancel} className="w-full text-sm text-[var(--sv-text-soft)] hover:text-[var(--sv-text)] transition">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

