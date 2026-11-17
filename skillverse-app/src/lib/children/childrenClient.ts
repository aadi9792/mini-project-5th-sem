/**
 * Skillverse Children Client
 * Wraps /api/v1/children endpoints using httpOnly cookie sessions.
 */

export interface ChildProfile {
  id: string;
  guardianId: string;
  nickname: string;
  age: number;
  interests: string[];
  tutorialCompletedAt?: string | null;
  activeTheme?: string | null;
  totalStars?: number;
  totalCoins?: number;
  avatarBaseFace?: string | null;
}

export interface ChildStateResponse {
  child: ChildProfile;
  hasPreferences: boolean;
  tutorialCompleted: boolean;
}

export interface CreateChildPayload {
  nickname: string;
  age: number;
  interests: string[];
}

export interface PreferencesPayload {
  q1Sound: string;
  q2Motion: string;
  q3Transitions: string;
  q4AttentionSpan: string;
  q5SocialComfort: string;
  q6RegulationStrategy: string[];
  q7CheckInStyle: string;
  q8InstructionStyle: string;
  q9GuidanceNeeded: string;
  q10Predictability: string;
  q11Motor: string;
  q12FirstFocusArea: string[];
}

export interface DerivedPreferences {
  soundDefaultOn: boolean;
  defaultVolume: number;
  calmModeDefault: boolean;
  particleIntensity: 'normal' | 'low' | 'off';
  countdownSeconds: number;
  autoTransitionWarning: boolean;
  defaultSessionMinutes: number;
  focusBlockMinutes: number;
  socialEntryMode: 'jump_in' | 'observe_first';
  regulationStrategyOrder: string[];
  proactiveCheckInsEnabled: boolean;
  instructionDensity: 'icons_only' | 'icons_plus_text' | 'short_sentences' | 'longer_text';
  hintDelaySeconds: number;
  taskBreakdownGranularity: 'coarse' | 'medium' | 'fine';
  predictabilityPromptsDefault: boolean;
  journeyLineVerbosity: 'detailed' | 'standard' | 'minimal';
  tapTargetSize: 'standard' | 'large' | 'extra_large';
  preferTapOverDrag: boolean;
  recommendedWorldOrder: string[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/v1/children${path}`, {
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

export const childrenClient = {
  async getMyChild(): Promise<ChildStateResponse | null> {
    try {
      return await request<ChildStateResponse>('/me', { method: 'GET' });
    } catch (err: any) {
      if (err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  },

  async createChild(payload: CreateChildPayload): Promise<{ child: ChildProfile }> {
    return request<{ child: ChildProfile }>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProfile(childId: string, payload: Partial<CreateChildPayload>): Promise<{ child: ChildProfile }> {
    return request<{ child: ChildProfile }>(`/${childId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async createPreferences(
    childId: string,
    payload: PreferencesPayload,
  ): Promise<{ preferences: any }> {
    return request<{ preferences: any }>(`/${childId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePreferences(
    childId: string,
    payload: Partial<PreferencesPayload>,
  ): Promise<{ preferences: any }> {
    return request<{ preferences: any }>(`/${childId}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getDerivedPreferences(childId: string): Promise<DerivedPreferences> {
    return request<DerivedPreferences>(`/${childId}/preferences/derived`, {
      method: 'GET',
    });
  },

  async completeTutorial(childId: string): Promise<{ child: ChildProfile }> {
    return request<{ child: ChildProfile }>(`/${childId}/complete-tutorial`, {
      method: 'POST',
    });
  },
};

