import { getBrowserSupabaseClient, isSupabaseConfigured } from './supabase';

export type HomeRailBanner = {
  slot: 1 | 2 | 3;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  active: boolean;
};

const MAX_URL_LENGTH = 1000;
const MAX_ALT_LENGTH = 120;
const BLOCKED_SCHEMES = /^(javascript:|data:|file:|vbscript:)/i;
const ALLOWED_SCHEMES = /^https?:\/\//i;

export const validateBannerUrl = (url: string): boolean => {
  if (!url) return true;
  if (url.length > MAX_URL_LENGTH) return false;
  if (BLOCKED_SCHEMES.test(url)) return false;
  return ALLOWED_SCHEMES.test(url);
};

const DEFAULT_SLOTS: HomeRailBanner[] = [
  { slot: 1, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 2, imageUrl: '', linkUrl: '', alt: '', active: false },
  { slot: 3, imageUrl: '', linkUrl: '', alt: '', active: false },
];

export const normalizeBanners = (raw: unknown): HomeRailBanner[] => {
  const slots: HomeRailBanner[] = DEFAULT_SLOTS.map((s) => ({ ...s }));
  if (!Array.isArray(raw)) return slots;
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const slot = r['slot'];
    if (slot !== 1 && slot !== 2 && slot !== 3) continue;
    const idx = (slot as number) - 1;
    slots[idx] = {
      slot: slot as 1 | 2 | 3,
      imageUrl: typeof r['imageUrl'] === 'string' ? r['imageUrl'].slice(0, MAX_URL_LENGTH) : '',
      linkUrl: typeof r['linkUrl'] === 'string' ? r['linkUrl'].slice(0, MAX_URL_LENGTH) : '',
      alt: typeof r['alt'] === 'string' ? r['alt'].slice(0, MAX_ALT_LENGTH) : '',
      active: Boolean(r['active']),
    };
  }
  return slots;
};

export const getHomeRailBanners = async (): Promise<HomeRailBanner[] | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'home_rail_banners')
      .single();
    if (error || !data) return null;
    return normalizeBanners((data as { value: unknown }).value);
  } catch {
    return null;
  }
};

export const saveHomeRailBanners = async (
  banners: HomeRailBanner[],
): Promise<{ ok: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase가 설정되지 않았습니다.' };
  }
  const supabase = getBrowserSupabaseClient();
  if (!supabase) {
    return { ok: false, message: 'Supabase 클라이언트를 초기화할 수 없습니다.' };
  }
  for (const b of banners) {
    if (!validateBannerUrl(b.imageUrl)) {
      return {
        ok: false,
        message: `슬롯 ${b.slot}: 이미지 URL 형식이 올바르지 않습니다. http 또는 https로 시작해야 합니다.`,
      };
    }
    if (!validateBannerUrl(b.linkUrl)) {
      return {
        ok: false,
        message: `슬롯 ${b.slot}: 링크 URL 형식이 올바르지 않습니다. http 또는 https로 시작해야 합니다.`,
      };
    }
    if (b.alt.length > MAX_ALT_LENGTH) {
      return {
        ok: false,
        message: `슬롯 ${b.slot}: 대체 텍스트는 ${MAX_ALT_LENGTH}자 이내여야 합니다.`,
      };
    }
  }
  const normalized = normalizeBanners(banners);
  let updatedBy: string | undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    updatedBy = sessionData.session?.user?.id;
  } catch {
    // proceed without updated_by
  }
  try {
    const payload: Record<string, unknown> = {
      key: 'home_rail_banners',
      value: normalized,
      updated_at: new Date().toISOString(),
    };
    if (updatedBy) payload['updated_by'] = updatedBy;
    const { error } = await supabase.from('site_settings').upsert(payload);
    if (error) {
      return { ok: false, message: '저장에 실패했습니다. 관리자 권한을 확인하세요.' };
    }
    return { ok: true, message: '배너 설정이 저장되었습니다.' };
  } catch {
    return { ok: false, message: '저장 중 오류가 발생했습니다.' };
  }
};

export const isCurrentUserSiteAdmin = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return false;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return false;
    const { data, error } = await supabase
      .from('site_admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    return !error && Boolean(data);
  } catch {
    return false;
  }
};
