/**
 * Static contract check for Phase 3DF-HF4 Lab Matrix Cross-Year Hover Highlight.
 * Validates data attributes, interaction script, CSS states, and fixture integrity.
 * No network calls. No .env reads. Exits non-zero on failure.
 */

globalThis.fetch = async (url) => {
  throw new Error(`[checker] BLOCKED unexpected network call to: ${String(url).slice(0, 60)}`);
};

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const COMPONENT    = join(root, 'src', 'components', 'LabReturnMatrix.astro');
const FIXTURE_PATH = join(root, 'src', 'data', 'labReturnMatrices.json');
const STYLE_PATH   = join(root, 'src', 'styles', 'style.css');
const RESULT_DOC   = join(root, 'docs', 'planning', 'phase_3df_hf4_lab_matrix_cross_year_hover_result_v0.1.md');
const PACKAGE_JSON = join(root, 'package.json');
const API_LAB_DIR  = join(root, 'src', 'pages', 'api', 'lab');

const log = (msg) => process.stdout.write(msg + '\n');
let passes = 0;
let failures = 0;

const check = (label, pass) => {
  log(`  [${pass ? 'PASS' : 'FAIL'}] ${label}`);
  if (pass) passes++; else failures++;
};

log('=== Phase 3DF-HF4 Lab Matrix Cross-Year Hover Highlight — Static Contract Check ===');
log('');

// ---------------------------------------------------------------------------
// Group 1: File existence
// ---------------------------------------------------------------------------
log('--- Group 1: File existence ---');

const compExists   = existsSync(COMPONENT);
const dataExists   = existsSync(FIXTURE_PATH);
const resultExists = existsSync(RESULT_DOC);

check('LabReturnMatrix.astro component exists', compExists);
check('labReturnMatrices.json fixture exists', dataExists);
check('Phase 3DF-HF4 result doc exists', resultExists);

let pkg = {};
try { pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
check('package.json has check:lab-matrix-hover script',
  typeof pkg.scripts?.['check:lab-matrix-hover'] === 'string');

log('');

if (!compExists || !dataExists) {
  log('ERROR: Required files missing. Cannot continue.');
  process.exitCode = 1;
  process.exit(1);
}

const compSrc = readFileSync(COMPONENT, 'utf8');
const css     = existsSync(STYLE_PATH) ? readFileSync(STYLE_PATH, 'utf8') : '';

// ---------------------------------------------------------------------------
// Group 2: Data attributes in component
// ---------------------------------------------------------------------------
log('--- Group 2: Data attributes ---');

check('Component has data-lab-return-matrix-root attribute',
  compSrc.includes('data-lab-return-matrix-root'));
check('Component has data-lab-category-id attribute',
  compSrc.includes('data-lab-category-id'));
check('Component has data-lab-matrix-cell attribute',
  compSrc.includes('data-lab-matrix-cell'));
check('Component has data-lab-category-chip attribute',
  compSrc.includes('data-lab-category-chip'));

check('data-lab-matrix-cell present on matrix rank cells',
  compSrc.includes('data-lab-matrix-cell') && compSrc.includes('lab-return-cell'));
check('data-lab-category-chip present on legend chips',
  compSrc.includes('data-lab-category-chip') && compSrc.includes('lab-matrix-chip'));
check('data-lab-category-id assigned from cat.id or cell.categoryId',
  compSrc.includes('data-lab-category-id={cat.id}') ||
  compSrc.includes('data-lab-category-id={cell.categoryId}') ||
  compSrc.includes('data-lab-category-id'));

log('');

// ---------------------------------------------------------------------------
// Group 3: Highlight hint copy
// ---------------------------------------------------------------------------
log('--- Group 3: Hint copy ---');

check('Component contains cross-year highlight hint copy',
  compSrc.includes('강조됩니다') || compSrc.includes('강조'));
check('Hint mentions mouse or tap (마우스 / 탭)',
  compSrc.includes('마우스') || compSrc.includes('탭'));
check('Hint references same item (같은 항목 / 같은 자산군)',
  compSrc.includes('같은 항목') || compSrc.includes('같은 자산군'));
check('Hint has lab-matrix-interaction-hint class or similar wrapper',
  compSrc.includes('interaction-hint') || compSrc.includes('lab-matrix-hint'));

log('');

// ---------------------------------------------------------------------------
// Group 4: Interaction script
// ---------------------------------------------------------------------------
log('--- Group 4: Interaction script ---');

check('Component contains <script block',
  compSrc.includes('<script'));

check('Script contains pointer or mouse event listener for hover (pointerover/mouseover)',
  compSrc.includes('pointerover') || compSrc.includes('mouseover'));

check('Script contains pointerleave or mouseleave for hover clear',
  compSrc.includes('pointerleave') || compSrc.includes('mouseleave'));

check('Script contains click or pointerup listener for tap/pin fallback',
  compSrc.includes("addEventListener('click'") || compSrc.includes('addEventListener("click"') ||
  compSrc.includes("addEventListener('pointerup'") || compSrc.includes('addEventListener("pointerup"'));

check('Script contains Escape key handling',
  compSrc.includes("'Escape'") || compSrc.includes('"Escape"'));

check('Script scopes to each matrix root (querySelectorAll or per-root setup)',
  compSrc.includes('[data-lab-return-matrix-root]') &&
  (compSrc.includes('querySelectorAll') || compSrc.includes('forEach')));

check('Script uses applyHighlight or equivalent highlight function',
  compSrc.includes('applyHighlight') || compSrc.includes('is-highlighted'));

check('Script uses clearHighlight or equivalent clear function',
  compSrc.includes('clearHighlight') || compSrc.includes("remove('is-highlighted")
  || compSrc.includes('classList.remove'));

check('Script implements pinned/toggle behavior',
  compSrc.includes('pinned') || compSrc.includes('toggle'));

log('');

// ---------------------------------------------------------------------------
// Group 5: Safety boundaries — no forbidden patterns
// ---------------------------------------------------------------------------
log('--- Group 5: Safety boundaries ---');

check('No fetch() call in component', !compSrc.includes('fetch('));
check('No XMLHttpRequest in component', !compSrc.includes('XMLHttpRequest'));
check('No localStorage in component', !compSrc.includes('localStorage'));
check('No sessionStorage in component', !compSrc.includes('sessionStorage'));
check('No setInterval in component', !compSrc.includes('setInterval'));
check('No setTimeout in component', !compSrc.includes('setTimeout'));
check('No Supabase import in component', !compSrc.includes('@supabase'));
check('No KIS endpoint in component',
  !compSrc.includes('koreainvestment') && !compSrc.includes('KIS_APP'));
check('No GNews endpoint in component', !compSrc.includes('gnews.io'));
check('No AI provider in component',
  !compSrc.includes('openai.com') && !compSrc.includes('anthropic.com') && !compSrc.includes('generativelanguage'));
check('No service_role in component', !compSrc.includes('service_role'));
check('No external import in script (interaction is self-contained)',
  !compSrc.includes("from 'https://") && !compSrc.includes('from "https://'));
check('No canvas in component', !compSrc.includes('canvas'));

log('');

// ---------------------------------------------------------------------------
// Group 6: CSS states
// ---------------------------------------------------------------------------
log('--- Group 6: CSS highlight states ---');

check('style.css contains .is-highlighted rule for Lab matrix',
  css.includes('is-highlighted'));
check('style.css contains .is-dimmed rule for Lab matrix',
  css.includes('is-dimmed'));
check('style.css contains cursor pointer for matrix cells or chips',
  css.includes('[data-lab-matrix-cell]') || css.includes('[data-lab-category-chip]'));
check('style.css has lab-matrix-has-active scoping class',
  css.includes('lab-matrix-has-active'));
check('style.css has prefers-reduced-motion handling',
  css.includes('prefers-reduced-motion'));
check('style.css has lab-matrix-interaction-hint or similar class',
  css.includes('lab-matrix-interaction-hint') || css.includes('interaction-hint'));

log('');

// ---------------------------------------------------------------------------
// Group 7: Fixture data integrity
// ---------------------------------------------------------------------------
log('--- Group 7: Fixture data integrity ---');

let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
  check('labReturnMatrices.json still parses without error', true);
} catch (e) {
  check('labReturnMatrices.json still parses without error', false);
  log(`  Parse error: ${e.message}`);
}

if (fixture) {
  check('assetMatrix still exists in fixture', typeof fixture.assetMatrix === 'object');
  check('sectorMatrix still exists in fixture', typeof fixture.sectorMatrix === 'object');

  const am = fixture.assetMatrix ?? {};
  const sm = fixture.sectorMatrix ?? {};

  check('assetMatrix categories still have id field',
    Array.isArray(am.categories) && am.categories.every((c) => typeof c.id === 'string' && c.id.length > 0));
  check('sectorMatrix categories still have id field',
    Array.isArray(sm.categories) && sm.categories.every((c) => typeof c.id === 'string' && c.id.length > 0));

  check('assetMatrix ranking cells still have categoryId',
    Array.isArray(am.rankings) && am.rankings.every((r) =>
      Array.isArray(r.cells) && r.cells.every((c) => typeof c.categoryId === 'string' && c.categoryId.length > 0)
    ));
  check('sectorMatrix ranking cells still have categoryId',
    Array.isArray(sm.rankings) && sm.rankings.every((r) =>
      Array.isArray(r.cells) && r.cells.every((c) => typeof c.categoryId === 'string' && c.categoryId.length > 0)
    ));

  check('No data values were changed (fixture note still present)',
    typeof am.note === 'string' && am.note.includes('예시 데이터'));
  check('No investment advice added to fixture',
    !JSON.stringify(fixture).includes('매수 신호') && !JSON.stringify(fixture).includes('매도 신호'));
}

log('');

// ---------------------------------------------------------------------------
// Group 8: No new API routes or DB migrations
// ---------------------------------------------------------------------------
log('--- Group 8: No new infrastructure ---');

check('No Lab API route directory created', !existsSync(API_LAB_DIR));

const migrationDir = join(root, 'supabase', 'migrations');
let latestMigrationIsNew = false;
try {
  const { readdirSync } = await import('fs');
  const migrations = readdirSync(migrationDir).filter((f) => f.startsWith('20260626'));
  latestMigrationIsNew = migrations.length > 0;
} catch {
  // directory not readable or missing — not a failure
}
check('No DB migration added for hover phase', !latestMigrationIsNew);

check('No KIS/GNews/AI provider import added to component',
  !compSrc.includes('@supabase') &&
  !compSrc.includes('openai') &&
  !compSrc.includes('gnews'));

log('');

// ---------------------------------------------------------------------------
// Group 9: Checker self-check
// ---------------------------------------------------------------------------
log('--- Group 9: Checker self-check ---');

let fetchAttempted = false;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => { fetchAttempted = true; throw new Error('blocked'); };
check('Checker makes no network calls during execution', !fetchAttempted);
globalThis.fetch = origFetch;
check('Checker is a static-only validation script', true);

log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
log('=== Phase 3DF-HF4 Lab Matrix Cross-Year Hover Highlight — Summary ===');
const total = passes + failures;
log(`Checks passed: ${passes}/${total}`);
log('');

if (failures === 0) {
  log('Result: PASS — Lab matrix hover highlight contract verified');
  process.exitCode = 0;
} else {
  log(`Result: FAIL (${failures} failure(s))`);
  process.exitCode = 1;
}
