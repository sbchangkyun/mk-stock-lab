/**
 * Owner-run GNews live smoke script (Phase 3BD, patched in Phase 3BE-R1, Phase 3BE-R3).
 * Default mode: dry-run. No network, no env reads, no API key access in dry-run mode.
 * Live mode: requires --execute-live AND --confirm-owner-approved AND all env guard conditions.
 *
 * Phase 3BE-R1 additions:
 *   --theme=<queryKey> selects a single GNews query theme for the live run.
 *   GNEWS_BASE_URL is validated as endpoint-only (no query string, no embedded key).
 *
 * Phase 3BE-R3 additions:
 *   --query-profile=<profile> selects a query profile: policy (default) or simple.
 *   simple profile applies smoke-only short query terms instead of policy query strings.
 *   Definitions are cloned; imported GNEWS_QUERY_DEFINITIONS are never mutated.
 *
 * IMPORTANT: Do not run with --execute-live without explicit owner approval and env configuration.
 * Claude Code must not execute the live branch. The smoke:gnews-live:dry package script is safe.
 *
 * Usage:
 *   Dry-run (safe, always):  node scripts/owner_smoke_gnews_live_fetch.mjs --dry-run
 *   Live with theme:         node scripts/owner_smoke_gnews_live_fetch.mjs --execute-live --confirm-owner-approved --theme=fx
 *   Live with simple:        node scripts/owner_smoke_gnews_live_fetch.mjs --execute-live --confirm-owner-approved --theme=fx --query-profile=simple
 *   Live multi-theme:        node scripts/owner_smoke_gnews_live_fetch.mjs --execute-live --confirm-owner-approved --max-themes=2
 */

import {
  GNEWS_QUERY_DEFINITIONS,
  GNEWS_ADAPTER_POLICY,
  fetchGnewsMarketNewsBatch,
  summarizeGnewsLiveFetchResult,
} from '../src/lib/news/gnewsLiveFetchAdapter.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_THEMES_CAP = 2;
const PHASE_TAG = 'gnews3bd';

/** Allowlist of valid --theme queryKey values. Must match GNEWS_QUERY_DEFINITIONS. */
export const SMOKE_ALLOWED_THEME_KEYS = new Set([
  'market_stocks',
  'macro_policy',
  'fx',
  'oil_commodities',
  'crypto_digital_assets',
  'personal_finance',
]);

// ---------------------------------------------------------------------------
// CLI flag parsing (reads process.argv only — not env vars)
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const executeLiveFlag = args.includes('--execute-live');
const ownerConfirmedFlag = args.includes('--confirm-owner-approved');
const isDryRun = !executeLiveFlag || args.includes('--dry-run');

const maxThemeArg = args.find((a) => a.startsWith('--max-themes='));
const rawMaxThemes = maxThemeArg ? parseInt(maxThemeArg.replace('--max-themes=', ''), 10) : MAX_THEMES_CAP;
const maxThemes = Math.min(Math.max(1, isNaN(rawMaxThemes) ? MAX_THEMES_CAP : rawMaxThemes), MAX_THEMES_CAP);

// ---------------------------------------------------------------------------
// Exported pure helpers
// No env reads. No network. No output. No file mutations.
// ---------------------------------------------------------------------------

/**
 * Extracts the --theme=<key> value from the arg list.
 * Returns the key string if present and non-empty, otherwise null.
 */
export function parseThemeArg(argList) {
  const themeArg = argList.find((a) => a.startsWith('--theme='));
  if (!themeArg) return null;
  const val = themeArg.replace('--theme=', '');
  return val.length > 0 ? val : null;
}

/**
 * Selects which query definitions to use for the live smoke run.
 *   - themeKey null/absent: returns first max definitions (existing behavior, max capped at 2).
 *   - themeKey valid:       returns exactly one matching definition.
 *   - themeKey invalid:     returns { ok: false, code: 'invalid_theme' }.
 * Does not read env vars, call fetch, or output anything.
 */
export function selectSmokeThemeDefinitions(definitions, { themeKey = null, maxThemes: max = MAX_THEMES_CAP } = {}) {
  if (!themeKey) {
    return { ok: true, definitions: definitions.slice(0, Math.min(Math.max(1, max), MAX_THEMES_CAP)) };
  }
  if (!SMOKE_ALLOWED_THEME_KEYS.has(themeKey)) {
    return { ok: false, code: 'invalid_theme' };
  }
  const matched = definitions.find((d) => d.queryKey === themeKey);
  if (!matched) {
    // Defensive: allowlist matches GNEWS_QUERY_DEFINITIONS, so this should not occur.
    return { ok: false, code: 'invalid_theme' };
  }
  return { ok: true, definitions: [matched] };
}

/**
 * Smoke-only simplified query profile map.
 * For owner smoke validation only — not the Phase 3AY production ingestion policy.
 * Does not replace GNEWS_QUERY_DEFINITIONS in gnewsLiveFetchAdapter.mjs.
 */
export const SMOKE_QUERY_PROFILE_SIMPLE_MAP = {
  market_stocks: '주식',
  macro_policy: '금리',
  fx: '환율',
  oil_commodities: '유가',
  crypto_digital_assets: '비트코인',
  personal_finance: '재테크',
};

/** Allowlist of valid --query-profile values. */
export const SMOKE_ALLOWED_QUERY_PROFILES = new Set(['policy', 'simple']);

/**
 * Extracts --query-profile=<value> from the arg list.
 * Returns the value if present and non-empty, otherwise 'policy' (the default).
 */
export function parseQueryProfileArg(argList) {
  const arg = argList.find((a) => a.startsWith('--query-profile='));
  if (!arg) return 'policy';
  const val = arg.replace('--query-profile=', '');
  return val.length > 0 ? val : 'policy';
}

/**
 * Validates a query profile against the allowlist.
 * Returns { ok: true } or { ok: false, code: 'invalid_query_profile' }.
 */
export function validateQueryProfile(profile) {
  if (!profile || !SMOKE_ALLOWED_QUERY_PROFILES.has(profile)) {
    return { ok: false, code: 'invalid_query_profile' };
  }
  return { ok: true };
}

/**
 * Applies the smoke query profile to selected definitions.
 * Returns shallow clones — never mutates the imported GNEWS_QUERY_DEFINITIONS.
 * - 'policy': clones definitions with queryString unchanged.
 * - 'simple': clones definitions with queryString replaced by smoke-only short query.
 * Never prints or returns the queryString in caller-visible summary fields.
 */
export function applySmokeQueryProfile(definitions, profile) {
  if (profile === 'simple') {
    return definitions.map((def) => ({
      ...def,
      queryString: SMOKE_QUERY_PROFILE_SIMPLE_MAP[def.queryKey] ?? def.queryString,
    }));
  }
  return definitions.map((def) => ({ ...def }));
}

/**
 * Validates that GNEWS_BASE_URL is an endpoint-only URL.
 * Rejects query strings and embedded key/token/q fragments.
 * Returns { ok: true } or { ok: false, code: 'invalid_base_url' }.
 * Never logs or returns the URL value.
 */
export function validateEndpointOnlyBaseUrl(value) {
  if (!value || typeof value !== 'string') return { ok: false, code: 'invalid_base_url' };
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, code: 'invalid_base_url' };
  }
  if (parsed.search && parsed.search.length > 0) return { ok: false, code: 'invalid_base_url' };
  // Reject embedded key/token/query fragments in the raw string
  const lower = value.toLowerCase();
  if (
    lower.includes('apikey=') ||
    lower.includes('key=') ||
    lower.includes('token=') ||
    lower.includes('?q=') ||
    lower.includes('&q=')
  ) {
    return { ok: false, code: 'invalid_base_url' };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sanitized output helpers
// ---------------------------------------------------------------------------

const defaultOut = (msg) => process.stdout.write(msg + '\n');

// Blocks output that may contain key values, raw article content, or stack traces.
const FORBIDDEN_OUTPUT_PATTERN =
  /GNEWS_API_KEY=\S|PUBLIC_GNEWS_API_KEY=\S|"articles"\s*:\s*\[|"title"\s*:\s*"|"description"\s*:\s*"|stack\s*at\s/i;

const safeLog = (msg, out = defaultOut) => {
  if (FORBIDDEN_OUTPUT_PATTERN.test(String(msg))) {
    out(`${PHASE_TAG} step=safe-output-guard status=blocked code=SAFE_OUTPUT_BLOCKED sanitized=true`);
    throw new Error('Unsafe output blocked by sanitizer.');
  }
  out(msg);
};

const makeLogStep = (out) => (step, status, extra = {}) => {
  const parts = [`${PHASE_TAG} step=${step} status=${status}`];
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${v}`);
  }
  parts.push('sanitized=true');
  safeLog(parts.join(' '), out);
};

// ---------------------------------------------------------------------------
// Dry-run: no network, no env reads, no API key access.
// Exported for direct invocation by the dry-run checker.
// ---------------------------------------------------------------------------

export function runDryRun(out = defaultOut) {
  const logStep = makeLogStep(out);
  logStep('mode-check', 'confirmed', { mode: 'dry-run', note: 'no-network-no-env-reads' });
  logStep('live-blocked-by-default', 'confirmed', {
    note: 'live-requires-execute-live-flag-plus-all-guard-conditions',
  });
  logStep('max-requests-policy', 'confirmed', {
    maxRequests: String(MAX_THEMES_CAP),
    maxThemes: String(MAX_THEMES_CAP),
    note: 'hard-cap-two-requests-per-live-run',
  });
  logStep('output-sanitizer', 'active', {
    note: 'article-urls-titles-descriptions-key-values-raw-json-blocked',
  });
  logStep('route-boundary', 'confirmed', {
    source: 'fixture',
    liveEnabled: 'false',
    note: 'market-feed-route-unchanged-fixture-backed',
  });
  logStep('dry-run-result', 'passed', { liveAttempted: 'false' });
  out(`${PHASE_TAG} mode=dry-run liveAttempted=false maxRequests=2 result=PASS sanitized=true`);
}

// ---------------------------------------------------------------------------
// Live guard: reads env vars only after CLI flags and theme are confirmed.
// ---------------------------------------------------------------------------

const checkLiveGuards = () => {
  if (!executeLiveFlag) return { ok: false, code: 'missing_execute_live_flag' };
  if (!ownerConfirmedFlag) return { ok: false, code: 'missing_owner_confirmation' };

  // Read env vars — only reached after CLI flags and theme validation have passed
  const liveEnabled = process.env.GNEWS_LIVE_ENABLED;
  if (liveEnabled !== 'true') return { ok: false, code: 'live_disabled' };

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return { ok: false, code: 'production_blocked' };

  const baseUrl = process.env.GNEWS_BASE_URL;
  if (!baseUrl || typeof baseUrl !== 'string') return { ok: false, code: 'missing_base_url' };

  // Reject query strings and embedded key fragments in GNEWS_BASE_URL
  const baseUrlCheck = validateEndpointOnlyBaseUrl(baseUrl);
  if (!baseUrlCheck.ok) return { ok: false, code: 'invalid_base_url' };

  // GNEWS_API_KEY is the preferred server-only key.
  // PUBLIC_GNEWS_API_KEY is the server-side fallback — never used by browser/client code.
  const apiKey = process.env.GNEWS_API_KEY || process.env.PUBLIC_GNEWS_API_KEY;
  if (!apiKey) return { ok: false, code: 'missing_api_key' };

  if (maxThemes > MAX_THEMES_CAP) return { ok: false, code: 'invalid_theme_limit' };

  return { ok: true, baseUrl, apiKey };
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const main = async () => {
  const logStep = makeLogStep(defaultOut);

  // Default: dry-run. No env reads, no network, always safe to execute.
  if (isDryRun) {
    runDryRun();
    process.exitCode = 0;
    return;
  }

  // Live branch — only reached when --execute-live is passed
  logStep('guard-check', 'started');

  // Step 1: Theme validation — pure, no env reads, fails before key access if invalid
  const rawThemeKey = parseThemeArg(args);
  const themeResult = selectSmokeThemeDefinitions(GNEWS_QUERY_DEFINITIONS, {
    themeKey: rawThemeKey,
    maxThemes,
  });
  if (!themeResult.ok) {
    logStep('guard-check', 'failed', { code: themeResult.code });
    process.exitCode = 1;
    return;
  }

  // Step 1b: Query profile validation — pure, no env reads, fails before key access if invalid
  const rawQueryProfile = parseQueryProfileArg(args);
  const queryProfileCheck = validateQueryProfile(rawQueryProfile);
  if (!queryProfileCheck.ok) {
    logStep('guard-check', 'failed', { code: queryProfileCheck.code });
    process.exitCode = 1;
    return;
  }

  // Step 2: Env guard — reads env vars only after theme and query profile are confirmed valid
  const guard = checkLiveGuards();
  if (!guard.ok) {
    logStep('guard-check', 'failed', { code: guard.code });
    process.exitCode = 1;
    return;
  }
  logStep('guard-check', 'passed', { note: 'all-live-conditions-met' });

  const selectedDefinitions = themeResult.definitions;
  const effectiveMaxThemes = selectedDefinitions.length;
  const selectedTheme = rawThemeKey ? selectedDefinitions[0] : null;

  // Log theme selection — safe fields only (queryKey, category enum). queryString is never logged.
  const themeExtra = {
    maxThemes: String(effectiveMaxThemes),
    definitionCount: String(GNEWS_QUERY_DEFINITIONS.length),
  };
  if (selectedTheme) {
    themeExtra.themeKey = selectedTheme.queryKey;
    themeExtra.category = selectedTheme.category;
  }
  logStep('theme-selection', 'confirmed', themeExtra);

  // Apply smoke query profile — clones definitions, never mutates imported GNEWS_QUERY_DEFINITIONS
  const effectiveDefinitions = applySmokeQueryProfile(selectedDefinitions, rawQueryProfile);

  // Log query profile — profile name only, never the actual query strings
  logStep('query-profile', 'confirmed', { queryProfile: rawQueryProfile });

  logStep('live-fetch', 'started', { maxThemes: String(effectiveMaxThemes) });

  try {
    const nowIso = new Date().toISOString();

    // Live fetch: uses globalThis.fetch, injected via fetchFn parameter.
    // baseUrl and apiKey are passed as arguments — never logged.
    const batchResult = await fetchGnewsMarketNewsBatch(
      effectiveDefinitions,
      {
        fetchFn: globalThis.fetch,
        baseUrl: guard.baseUrl,
        apiKey: guard.apiKey,
        maxThemes: effectiveMaxThemes,
        nowIso,
      },
    );

    // Only the sanitized summary is logged — no raw articles, URLs, or content.
    const summary = summarizeGnewsLiveFetchResult(batchResult);

    logStep('live-fetch', 'completed', {
      ok: String(summary.ok),
      provider: summary.provider,
      liveAttempted: String(summary.liveAttempted),
      themeCount: String(summary.themeCount),
      successCount: String(summary.successCount),
      failureCount: String(summary.failureCount),
      articleCount: String(summary.articleCount),
      warningCount: String(summary.warningCount),
    });

    // Categories are enum values (e.g. MARKET_STOCKS) — safe to log.
    if (summary.categories.length > 0) {
      logStep('categories', 'reported', { categories: summary.categories.join(',') });
    }

    if (summary.errorCodes.length > 0) {
      logStep('error-codes', 'reported', { errorCodes: summary.errorCodes.join(',') });
    }

    const finalStatus = summary.ok ? 'passed' : 'failed';
    logStep('smoke-result', finalStatus, {
      liveAttempted: String(summary.liveAttempted),
      articleCount: String(summary.articleCount),
    });

    if (!summary.ok) {
      process.exitCode = 1;
    }
  } catch {
    logStep('smoke-result', 'failed', { code: 'internal_unavailable' });
    process.exitCode = 1;
  }
};

// Execute only when run directly, not when imported as a module.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('owner_smoke_gnews_live_fetch.mjs')) {
  main().catch(() => {
    defaultOut(`${PHASE_TAG} step=unexpected-catch status=failed code=internal_unavailable sanitized=true`);
    process.exitCode = 1;
  });
}
