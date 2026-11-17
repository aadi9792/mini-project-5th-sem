/**
 * Skillverse Auth Client
 * Wraps /api/v1/auth endpoints. Cookies (sv_access_token, sv_refresh_token)
 * are managed as httpOnly by the server, so credentials: "include" handles them automatically.
 */

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  confirmedGuardianStatus: boolean;
  dataStorageConsent: boolean;
  nonMedicalDeviceAck: boolean;
  marketingOptIn?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  child?: {
    id: string;
    nickname: string;
    activeTheme?: string;
  } | null;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  lockedUntil?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/v1/auth${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "An error occurred. Please try again.";
    const err = new Error(errorMsg) as Error & { statusCode: number; lockedUntil?: string };
    err.statusCode = res.status;
    if (data.lockedUntil) {
      err.lockedUntil = data.lockedUntil;
    }
    throw err;
  }

  return data as T;
}

export const authClient = {
  async signUp(data: SignUpData) {
    // Strip confirmPassword since it's client-side validation only
    const { confirmPassword, ...bodyPayload } = data;
    return request<{ message: string; guardianId: string; devVerificationToken?: string }>("/signup", {
      method: "POST",
      body: JSON.stringify(bodyPayload),
    });
  },

  async login(data: LoginData) {
    return request<{ message: string; user: UserProfile }>("/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async logout() {
    return request<{ message: string }>("/logout", {
      method: "POST",
    });
  },

  async getMe() {
    return request<{ user: UserProfile }>("/me", {
      method: "GET",
    });
  },

  async verifyEmail(token: string) {
    return request<{ message: string }>(`/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });
  },

  async resendVerification(email: string) {
    return request<{ message: string; devVerificationToken?: string }>("/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string, _confirmPassword?: string) {
    return request<{ message: string }>("/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword: password }),
    });
  },
};
