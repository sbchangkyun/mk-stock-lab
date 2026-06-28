import { getBrowserSupabaseClient, isSupabaseConfigured } from './supabase';

type BannerSlot = 1 | 2 | 3 | 4 | 5;

export type HomeRailBanner = {
  slot: BannerSlot;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  active: boolean;
};

export type HomeMobileBanner = {
  slot: BannerSlot;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  active: boolean;
};

type StoredHomeBannerSettings = {
  home_rail_banners: HomeRailBanner[];
  home_mobile_banners: HomeMobileBanner[];
};

const HOME_BANNER_SETTINGS_KEY = 'home_rail_banners';
const HOME_MOBILE_BANNERS_KEY = 'home_mobile_banners';
const BANNER_SLOTS = [1, 2, 3, 4, 5] as const;
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

const DEFAULT_SLOTS: HomeRailBanner[] = BANNER_SLOTS.map((slot) => ({
  slot,
  imageUrl: '',
  linkUrl: '',
  alt: '',
  active: false,
}));

const DEFAULT_MOBILE_SLOTS: HomeMobileBanner[] = BANNER_SLOTS.map((slot) => ({
  slot,
  imageUrl: '',
  linkUrl: '',
  alt: '',
  active: false,
}));

const isBannerSlot = (slot: unknown): slot is BannerSlot =>
  typeof slot === 'number' && BANNER_SLOTS.includes(slot as BannerSlot);

const normalizeBannerList = <T extends HomeRailBanner | HomeMobileBanner>(
  raw: unknown,
  defaults: T[],
): T[] => {
  const slots = defaults.map((slot) => ({ ...slot }));
  if (!Array.isArray(raw)) return slots;

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const slot = record['slot'];
    if (!isBannerSlot(slot)) continue;

    slots[slot - 1] = {
      slot,
      imageUrl:
        typeof record['imageUrl'] === 'string'
          ? record['imageUrl'].slice(0, MAX_URL_LENGTH)
          : '',
      linkUrl:
        typeof record['linkUrl'] === 'string'
          ? record['linkUrl'].slice(0, MAX_URL_LENGTH)
          : '',
      alt:
        typeof record['alt'] === 'string'
          ? record['alt'].slice(0, MAX_ALT_LENGTH)
          : '',
      active: Boolean(record['active']),
    } as T;
  }

  return slots;
};

export const normalizeBanners = (raw: unknown): HomeRailBanner[] =>
  normalizeBannerList(raw, DEFAULT_SLOTS);

export const normalizeMobileBanners = (raw: unknown): HomeMobileBanner[] =>
  normalizeBannerList(raw, DEFAULT_MOBILE_SLOTS);

const normalizeStoredHomeBannerSettings = (raw: unknown): StoredHomeBannerSettings => {
  if (Array.isArray(raw)) {
    return {
      home_rail_banners: normalizeBanners(raw),
      home_mobile_banners: normalizeMobileBanners(null),
    };
  }

  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    home_rail_banners: normalizeBanners(record[HOME_BANNER_SETTINGS_KEY]),
    home_mobile_banners: normalizeMobileBanners(record[HOME_MOBILE_BANNERS_KEY]),
  };
};

const bannerSettingsMatch = (
  expected: StoredHomeBannerSettings,
  actual: StoredHomeBannerSettings,
): boolean =>
  JSON.stringify(expected.home_rail_banners) === JSON.stringify(actual.home_rail_banners) &&
  JSON.stringify(expected.home_mobile_banners) === JSON.stringify(actual.home_mobile_banners);

const readHomeBannerSettings = async (): Promise<StoredHomeBannerSettings | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', HOME_BANNER_SETTINGS_KEY)
      .single();
    if (error || !data) return null;
    return normalizeStoredHomeBannerSettings((data as { value: unknown }).value);
  } catch {
    return null;
  }
};

export const getHomeRailBanners = async (): Promise<HomeRailBanner[] | null> => {
  const settings = await readHomeBannerSettings();
  return settings?.home_rail_banners ?? null;
};

export const getHomeMobileBanners = async (): Promise<HomeMobileBanner[] | null> => {
  const settings = await readHomeBannerSettings();
  return settings?.home_mobile_banners ?? null;
};

type BannerSaveResult = { ok: boolean; message: string };

const validateBannerList = (
  banners: Array<HomeRailBanner | HomeMobileBanner>,
): BannerSaveResult | null => {
  for (const banner of banners) {
    if (!validateBannerUrl(banner.imageUrl)) {
      return {
        ok: false,
        message: `슬롯 ${banner.slot}: 이미지 URL 형식이 올바르지 않습니다. http 또는 https로 시작해야 합니다.`,
      };
    }
    if (!validateBannerUrl(banner.linkUrl)) {
      return {
        ok: false,
        message: `슬롯 ${banner.slot}: 링크 URL 형식이 올바르지 않습니다. http 또는 https로 시작해야 합니다.`,
      };
    }
    if (banner.alt.length > MAX_ALT_LENGTH) {
      return {
        ok: false,
        message: `슬롯 ${banner.slot}: 대체 텍스트는 ${MAX_ALT_LENGTH}자 이내여야 합니다.`,
      };
    }
  }
  return null;
};

const saveHomeBannerSettings = async (
  target: 'desktop' | 'mobile',
  banners: HomeRailBanner[] | HomeMobileBanner[],
): Promise<BannerSaveResult> => {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase가 설정되지 않았습니다.' };
  }

  const validationError = validateBannerList(banners);
  if (validationError) return validationError;

  const supabase = getBrowserSupabaseClient();
  if (!supabase) {
    return { ok: false, message: 'Supabase 클라이언트를 초기화할 수 없습니다.' };
  }

  const current = await readHomeBannerSettings();
  if (!current) {
    return { ok: false, message: '기존 배너 설정을 불러오지 못해 저장하지 않았습니다.' };
  }

  const next: StoredHomeBannerSettings = {
    home_rail_banners:
      target === 'desktop' ? normalizeBanners(banners) : current.home_rail_banners,
    home_mobile_banners:
      target === 'mobile' ? normalizeMobileBanners(banners) : current.home_mobile_banners,
  };

  let updatedBy: string | undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    updatedBy = sessionData.session?.user?.id;
  } catch {
    // Proceed without updated_by; RLS still enforces write access.
  }

  try {
    const payload: Record<string, unknown> = {
      key: HOME_BANNER_SETTINGS_KEY,
      value: next,
      updated_at: new Date().toISOString(),
    };
    if (updatedBy) payload['updated_by'] = updatedBy;
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(payload)
      .select('value')
      .single();
    if (error || !data) {
      return { ok: false, message: '저장에 실패했습니다. 관리자 권한을 확인하세요.' };
    }
    const persisted = normalizeStoredHomeBannerSettings((data as { value: unknown }).value);
    if (!bannerSettingsMatch(next, persisted)) {
      return { ok: false, message: '저장된 배너 설정을 확인하지 못했습니다. 다시 시도하세요.' };
    }
    return { ok: true, message: '배너 설정이 저장되었습니다.' };
  } catch {
    return { ok: false, message: '저장 중 오류가 발생했습니다.' };
  }
};

export const saveHomeRailBanners = async (
  banners: HomeRailBanner[],
): Promise<BannerSaveResult> => saveHomeBannerSettings('desktop', banners);

export const saveHomeMobileBanners = async (
  banners: HomeMobileBanner[],
): Promise<BannerSaveResult> => saveHomeBannerSettings('mobile', banners);

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
