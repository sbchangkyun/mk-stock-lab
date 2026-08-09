/**
 * Phase 4F-UX1-B: Home MARKET NEWS urgent/exclusive emphasis.
 *
 * Pure, presentation-only classification of a source article TITLE into an emphasis level, based
 * on an exact leading-bracket-prefix whitelist. This does not touch feed ranking, provider
 * selection, or article filtering (see docs/planning/phase_4f_ux1b_home_news_emphasis_result_v0.1.md
 * §6) -- it only decides how HomeMarketNews.astro visually presents an already-fetched article.
 *
 * Matching rule: trim leading whitespace only, then require an EXACT match of one of the four
 * whitelisted bracket prefixes at position 0. No regex, no substring search elsewhere in the
 * title, no generic "starts with any [...]" pattern -- a near-miss like "[속보성]" or a prefix
 * that isn't at the very start (e.g. "오늘 [속보]...") intentionally yields null.
 */

export type NewsEmphasis = 'breaking' | 'exclusive' | null;

interface EmphasisPrefixRule {
  readonly prefix: string;
  readonly emphasis: 'breaking' | 'exclusive';
}

// Order is not semantically significant (prefixes are mutually exclusive by construction --
// each is a distinct fixed literal), kept as one explicit list per §2's "small pure parser"
// recommendation instead of scattered string checks.
const EMPHASIS_PREFIX_RULES: readonly EmphasisPrefixRule[] = [
  { prefix: '[급보]', emphasis: 'breaking' },
  { prefix: '[긴급]', emphasis: 'breaking' },
  { prefix: '[속보]', emphasis: 'breaking' },
  { prefix: '[단독]', emphasis: 'exclusive' },
];

export const parseHomeNewsEmphasis = (title: string): NewsEmphasis => {
  if (typeof title !== 'string' || title.length === 0) return null;
  const trimmed = title.trimStart();
  const rule = EMPHASIS_PREFIX_RULES.find((r) => trimmed.startsWith(r.prefix));
  return rule ? rule.emphasis : null;
};

export const HOME_NEWS_EMPHASIS_BADGE_LABEL: Record<'breaking' | 'exclusive', string> = {
  breaking: '속보',
  exclusive: '단독',
};

export const HOME_NEWS_EMPHASIS_CARD_CLASS: Record<'breaking' | 'exclusive', string> = {
  breaking: 'home-news-card--breaking',
  exclusive: 'home-news-card--exclusive',
};

export const getHomeNewsEmphasisBadgeLabel = (emphasis: NewsEmphasis): string | null =>
  emphasis ? HOME_NEWS_EMPHASIS_BADGE_LABEL[emphasis] : null;

export const getHomeNewsEmphasisCardClass = (emphasis: NewsEmphasis): string | null =>
  emphasis ? HOME_NEWS_EMPHASIS_CARD_CLASS[emphasis] : null;

/**
 * Presentation-only headline: strips a RECOGNIZED leading emphasis prefix (and the whitespace
 * immediately following it) for card display, since the emphasis badge already communicates it
 * separately (§3) -- avoids "[속보] [속보] ..." duplication. The full, untouched original title
 * is never discarded: callers must keep passing it through unchanged for aria-label/title so the
 * accessible name always identifies the real source headline.
 */
export const deriveHomeNewsDisplayTitle = (title: string, emphasis: NewsEmphasis): string => {
  if (!emphasis) return title;
  const trimmedStart = title.trimStart();
  const rule = EMPHASIS_PREFIX_RULES.find(
    (r) => r.emphasis === emphasis && trimmedStart.startsWith(r.prefix),
  );
  if (!rule) return title;
  const withoutPrefix = trimmedStart.slice(rule.prefix.length).trimStart();
  return withoutPrefix.length > 0 ? withoutPrefix : title;
};
