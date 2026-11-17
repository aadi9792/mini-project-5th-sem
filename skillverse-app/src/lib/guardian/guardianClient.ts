const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw { status: res.status, ...err };
  }
  if (res.status === 204) return null;
  return res.json();
}

export const journeyClient = {
  getTemplates: () => apiFetch('/journey/templates'),
  getQuestsForDate: (date: string) => apiFetch(`/journey/${date}`),
  createQuest: (body: {
    templateId?: string | null;
    label: string;
    emoji: string;
    scheduledFor: string;
    rewardStars?: number;
    rewardCoins?: number;
  }) => apiFetch('/journey/quests', { method: 'POST', body: JSON.stringify(body) }),
  updateQuest: (id: string, body: Partial<{ label: string; emoji: string; rewardStars: number; rewardCoins: number }>) =>
    apiFetch(`/journey/quests/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteQuest: (id: string) => apiFetch(`/journey/quests/${id}`, { method: 'DELETE' }),
  reorderQuests: (date: string, orderedQuestIds: string[]) =>
    apiFetch('/journey/reorder', { method: 'PATCH', body: JSON.stringify({ date, orderedQuestIds }) }),
  repeatYesterday: (forDate: string) =>
    apiFetch('/journey/repeat-yesterday', { method: 'POST', body: JSON.stringify({ forDate }) }),
};

export const difficultyClient = {
  getProfile: (gameId: string) => apiFetch(`/difficulty/${gameId}`),
  getAllProfiles: () => apiFetch('/difficulty'),
  updateProfile: (gameId: string, tier: 'easy' | 'medium' | 'hard') =>
    apiFetch(`/difficulty/${gameId}`, { method: 'PATCH', body: JSON.stringify({ tier }) }),
};

export const playSessionClient = {
  startSession: () => apiFetch('/play-sessions/start', { method: 'POST' }),
  heartbeat: (id: string) => apiFetch(`/play-sessions/${id}/heartbeat`, { method: 'POST' }),
  endSession: (id: string) => apiFetch(`/play-sessions/${id}/end`, { method: 'POST' }),
};

export const guardianClient = {
  verifyPassword: (password: string, intent: 'view' | 'action') =>
    apiFetch('/guardian/verify-password', { method: 'POST', body: JSON.stringify({ password, intent }) }),
  getMissionReport: () => apiFetch('/dashboard/mission-report'),
  getScreenTime: () => apiFetch('/screen-time'),
  updateScreenTime: (body: { quietHoursStart?: string | null; quietHoursEnd?: string | null }) =>
    apiFetch('/screen-time', { method: 'PATCH', body: JSON.stringify(body) }),
  exportData: async () => {
    const res = await fetch(`${API}/guardian/export`, { credentials: 'include' });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },
  deleteAccount: (confirmationPhrase: string) =>
    apiFetch('/guardian/account', { method: 'DELETE', body: JSON.stringify({ confirmationPhrase }) }),
};

