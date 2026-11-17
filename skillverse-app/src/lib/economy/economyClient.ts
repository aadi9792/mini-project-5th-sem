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

export const economyClient = {
  getSummary: () => apiFetch('/economy/summary'),
  getShop: () => apiFetch('/economy/shop'),
  buyItem: (itemId: string) => apiFetch('/economy/shop/buy', { method: 'POST', body: JSON.stringify({ itemId }) }),
  equipItem: (itemId: string) => apiFetch('/economy/shop/equip', { method: 'POST', body: JSON.stringify({ itemId }) }),
  unequipItem: (itemId: string) => apiFetch('/economy/shop/unequip', { method: 'POST', body: JSON.stringify({ itemId }) }),
  setAvatarFace: (face: string) => apiFetch('/economy/avatar/face', { method: 'POST', body: JSON.stringify({ face }) }),
  getWins: () => apiFetch('/economy/wins'),
  questComplete: (payload: {
    questType: 'GAME' | 'REAL_LIFE';
    gameId?: string;
    mode?: 'normal' | 'boss';
    realLifeQuestId?: string;
    remindersLevel?: 'none' | 'a_couple' | 'a_lot' | null;
    worldId?: string;
  }) => apiFetch('/economy/quest-complete', { method: 'POST', body: JSON.stringify(payload) }),
};

