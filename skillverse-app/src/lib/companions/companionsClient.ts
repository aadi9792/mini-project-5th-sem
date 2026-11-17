/**
 * Skillverse Companions & Theme Client
 * Wraps /api/v1/companions, /api/v1/zone-checkins, and /api/v1/children/:id/theme
 */

export interface CompanionTemplate {
  speciesId: string;
  displayName: string;
  emoji: string;
  personalityBlurb: string;
  isStarter: boolean;
  unlockLevel: number | null;
  locked?: boolean;
  adopted?: boolean;
  isActive?: boolean;
  customName?: string | null;
  companionId?: string | null;
}

export interface ChildCompanion {
  id: string;
  childId: string;
  speciesId: string;
  customName: string;
  isActive: boolean;
  adoptedAt: string;
  template?: CompanionTemplate | null;
}

export interface MyCompanionsResponse {
  active: ChildCompanion | null;
  owned: ChildCompanion[];
  childLevel: number;
  evolutionStage: {
    stage: number;
    name: string;
  };
}

export interface ZoneCheckInResponse {
  id: string;
  zone: string;
  mood: string;
  line: string;
  createdAt: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'An error occurred. Please try again.';
    const err = new Error(errorMsg) as Error & { statusCode: number };
    err.statusCode = res.status;
    throw err;
  }

  return data as T;
}

export const companionsClient = {
  async getCatalog(): Promise<{ companions: CompanionTemplate[]; childLevel: number }> {
    return request<{ companions: CompanionTemplate[]; childLevel: number }>('/api/v1/companions/catalog', {
      method: 'GET',
    });
  },

  async adopt(speciesId: string, customName: string): Promise<{ companion: ChildCompanion }> {
    return request<{ companion: ChildCompanion }>('/api/v1/companions/adopt', {
      method: 'POST',
      body: JSON.stringify({ speciesId, customName }),
    });
  },

  async rename(companionId: string, customName: string): Promise<{ companion: ChildCompanion }> {
    return request<{ companion: ChildCompanion }>(`/api/v1/companions/${companionId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ customName }),
    });
  },

  async activate(companionId: string): Promise<{ companion: ChildCompanion }> {
    return request<{ companion: ChildCompanion }>(`/api/v1/companions/${companionId}/activate`, {
      method: 'POST',
    });
  },

  async getMyCompanions(): Promise<MyCompanionsResponse> {
    return request<MyCompanionsResponse>('/api/v1/companions/me', {
      method: 'GET',
    });
  },

  async recordZoneCheckIn(zone: string): Promise<ZoneCheckInResponse> {
    return request<ZoneCheckInResponse>('/api/v1/zone-checkins', {
      method: 'POST',
      body: JSON.stringify({ zone }),
    });
  },

  async updateTheme(childId: string, theme: string): Promise<{ child: any }> {
    return request<{ child: any }>(`/api/v1/children/${childId}/theme`, {
      method: 'PATCH',
      body: JSON.stringify({ theme }),
    });
  },
};

