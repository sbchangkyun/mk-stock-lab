import type { APIRoute } from 'astro';
import {
  getSupabaseAdminClient,
  isSupabaseServerConfigured,
  validateUserFromBearerToken,
} from '../../../lib/server/supabaseAdmin';

export const prerender = false;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const safeString = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, maxLength);
};

const getDisplayName = (metadata: Record<string, unknown> | null | undefined) =>
  safeString(metadata?.name, 120) ||
  safeString(metadata?.full_name, 120) ||
  safeString(metadata?.user_name, 120);

export const POST: APIRoute = async ({ request }) => {
  const validation = await validateUserFromBearerToken(request.headers.get('authorization'));
  if (!validation.ok) {
    return jsonResponse(
      {
        ok: false,
        profileReady: false,
        code: validation.code,
        message: validation.message,
      },
      validation.status,
    );
  }

  if (!isSupabaseServerConfigured()) {
    return jsonResponse(
      {
        ok: false,
        profileReady: false,
        code: 'PROFILE_BOOTSTRAP_DISABLED',
        message: '프로필 API 설정이 아직 완료되지 않았습니다.',
      },
      503,
    );
  }

  try {
    const user = validation.user;
    const adminClient = getSupabaseAdminClient();
    const profilePayload = {
      id: user.id,
      email: safeString(user.email, 320),
      display_name: getDisplayName(user.user_metadata),
    };

    const { data, error } = await adminClient
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('id, display_name, plan')
      .single();

    if (error || !data) {
      return jsonResponse(
        {
          ok: false,
          profileReady: false,
          code: 'PROFILE_BOOTSTRAP_FAILED',
          message: '프로필 설정에 실패했습니다.',
        },
        500,
      );
    }

    return jsonResponse({
      ok: true,
      profileReady: true,
      profile: {
        displayName: data.display_name,
        plan: data.plan,
      },
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        profileReady: false,
        code: 'PROFILE_BOOTSTRAP_FAILED',
        message: '프로필 설정에 실패했습니다.',
      },
      500,
    );
  }
};
