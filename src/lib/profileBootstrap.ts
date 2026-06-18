import { getBrowserSupabaseClient, getCurrentSession, isSupabaseConfigured } from './supabase';

type ProfileBootstrapStatus =
  | 'disabled'
  | 'signed_out'
  | 'pending'
  | 'ready'
  | 'failed';

export type ProfileBootstrapResult = {
  status: ProfileBootstrapStatus;
  profileReady: boolean;
  message?: string;
  profile?: {
    displayName: string | null;
    plan: string | null;
  };
};

export const dispatchProfileBootstrapStatus = (result: ProfileBootstrapResult) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('mk:profile-bootstrap', { detail: result }));
};

export const bootstrapProfileForCurrentSession = async (): Promise<ProfileBootstrapResult> => {
  if (!isSupabaseConfigured() || !getBrowserSupabaseClient()) {
    const result: ProfileBootstrapResult = {
      status: 'disabled',
      profileReady: false,
      message: 'Supabase public configuration is unavailable.',
    };
    dispatchProfileBootstrapStatus(result);
    return result;
  }

  const session = await getCurrentSession();
  if (!session) {
    const result: ProfileBootstrapResult = {
      status: 'signed_out',
      profileReady: false,
      message: 'Login is required.',
    };
    dispatchProfileBootstrapStatus(result);
    return result;
  }

  dispatchProfileBootstrapStatus({
    status: 'pending',
    profileReady: false,
    message: 'Preparing profile.',
  });

  try {
    const response = await fetch('/api/auth/profile-bootstrap', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json',
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const result: ProfileBootstrapResult = {
        status: response.status === 503 ? 'disabled' : 'failed',
        profileReady: false,
        message: payload?.message || 'Profile setup is unavailable.',
      };
      dispatchProfileBootstrapStatus(result);
      return result;
    }

    const result: ProfileBootstrapResult = {
      status: 'ready',
      profileReady: Boolean(payload.profileReady),
      message: 'Profile is ready.',
      profile: {
        displayName: payload.profile?.displayName ?? null,
        plan: payload.profile?.plan ?? null,
      },
    };
    dispatchProfileBootstrapStatus(result);
    return result;
  } catch {
    const result: ProfileBootstrapResult = {
      status: 'failed',
      profileReady: false,
      message: 'Profile setup request failed.',
    };
    dispatchProfileBootstrapStatus(result);
    return result;
  }
};
