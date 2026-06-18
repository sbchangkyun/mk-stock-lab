import { getBrowserSupabaseClient, getCurrentSession, isSupabaseConfigured } from './supabase';

type ProfileBootstrapStatus =
  | 'public_config_missing'
  | 'server_config_missing'
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
      status: 'public_config_missing',
      profileReady: false,
      message: '로그인 설정이 아직 완료되지 않았습니다.',
    };
    dispatchProfileBootstrapStatus(result);
    return result;
  }

  const session = await getCurrentSession();
  if (!session) {
    const result: ProfileBootstrapResult = {
      status: 'signed_out',
      profileReady: false,
      message: '로그인이 필요합니다.',
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
        status: response.status === 503 ? 'server_config_missing' : 'failed',
        profileReady: false,
        message: payload?.message || '프로필 설정을 완료할 수 없습니다.',
      };
      dispatchProfileBootstrapStatus(result);
      return result;
    }

    const result: ProfileBootstrapResult = {
      status: 'ready',
      profileReady: Boolean(payload.profileReady),
      message: '프로필 준비가 완료되었습니다.',
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
      message: '프로필 설정 요청에 실패했습니다.',
    };
    dispatchProfileBootstrapStatus(result);
    return result;
  }
};
