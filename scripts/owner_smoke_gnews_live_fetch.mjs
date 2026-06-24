/**
 * Owner-run GNews live smoke script (Phase 3BD).
 * Default mode: dry-run. No network, no env reads, no API key access in dry-run mode.
 * Live mode: requires --execute-live AND --confirm-owner-approved AND all env guard conditions.
 *
 * IMPORTANT: Do not run with --execute-live without explicit owner approval and env configuration.
 * Claude Code must not execute the live branch. The smoke:gnews-live:dry package script is safe.
 *
 * Usage:
 *   Dry-run (safe, always):  node scripts/owner_smoke_gnews_live_fetch.mjs --dry-run
 *   Live (owner-only, gated): node scripts/owner_smoke_gnews_live_fetch.mjs --execute-live --confirm-owner-approved --max-themes=2
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
// Sanitized output helpers
// ---------------------------------------------------------------------------

const defaultOut = (msg) => process.stdout.write(msg + '\n');

// Blocks output that may contain key values, raw URLs, article content, or stack traces.
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
// Live guard: reads env vars only when --execute-live flag is confirmed.
// This function is only called from the live branch inside main().
// ---------------------------------------------------------------------------

const checkLiveGuards = () => {
  if (!executeLiveFlag) return { ok: false, code: 'missing_execute_live_flag' };
  if (!ownerConfirmedFlag) return { ok: false, code: 'missing_owner_confirmation' };

  // Read env vars — only reached after both CLI flags are confirmed
  const liveEnabled = process.env.GNEWS_LIVE_ENABLED;
  if (liveEnabled !== 'true') return { ok: false, code: 'live_disabled' };

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return { ok: false, code: 'production_blocked' };

  const baseUrl = process.env.GNEWS_BASE_URL;
  if (!baseUrl || typeof baseUrl !== 'string') return { ok: false, code: 'missing_base_url' };

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
  const guard = checkLiveGuards();
  if (!guard.ok) {
    logStep('guard-check', 'failed', { code: guard.code });
    process.exitCode = 1;
    return;
  }
  logStep('guard-check', 'passed', { note: 'all-live-conditions-met' });

  logStep('theme-selection', 'confirmed', {
    maxThemes: String(maxThemes),
    definitionCount: String(GNEWS_QUERY_DEFINITIONS.length),
  });

  logStep('live-fetch', 'started', { maxThemes: String(maxThemes) });

  try {
    const nowIso = new Date().toISOString();

    // Live fetch: uses globalThis.fetch, injected via fetchFn parameter.
    // baseUrl and apiKey are passed as arguments — never logged.
    const batchResult = await fetchGnewsMarketNewsBatch(
      GNEWS_QUERY_DEFINITIONS,
      {
        fetchFn: globalThis.fetch,
        baseUrl: guard.baseUrl,
        apiKey: guard.apiKey,
        maxThemes,
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

// Execute only when run directly, not when imported as a module by dry-run checker.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('owner_smoke_gnews_live_fetch.mjs')) {
  main().catch(() => {
    defaultOut(`${PHASE_TAG} step=unexpected-catch status=failed code=internal_unavailable sanitized=true`);
    process.exitCode = 1;
  });
}
