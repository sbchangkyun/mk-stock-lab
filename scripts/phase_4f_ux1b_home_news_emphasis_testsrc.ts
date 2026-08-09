/**
 * Phase 4F-UX1-B behavioral test source (bundled + run by
 * scripts/smoke_phase_4f_ux1b_home_news_emphasis.mjs via esbuild).
 *
 * Exercises the REAL, unmodified src/lib/home/homeNewsEmphasis.ts pure parser + the rendering
 * decision it drives (card modifier class + badge label) per spec §8. No network, no DOM/browser --
 * HomeMarketNews.astro's <script> block itself is verified separately by
 * scripts/check_phase_4f_ux1b_home_news_emphasis_contract.mjs (static source assertions), since an
 * Astro component script is not a standalone importable module.
 */

import {
  parseHomeNewsEmphasis,
  getHomeNewsEmphasisBadgeLabel,
  getHomeNewsEmphasisCardClass,
  deriveHomeNewsDisplayTitle,
} from '../src/lib/home/homeNewsEmphasis';

let passed = 0;
let failed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'} :: ${name}`);
};

export const runAll = async (): Promise<number> => {
  // --- §8 required parser cases ------------------------------------------
  check(
    '[속보] 삼성전자... -> breaking',
    parseHomeNewsEmphasis('[속보] 삼성전자 실적 발표') === 'breaking',
  );
  check(
    '[긴급] 원달러... -> breaking',
    parseHomeNewsEmphasis('[긴급] 원달러 환율 급등') === 'breaking',
  );
  check(
    '[급보] 증시... -> breaking',
    parseHomeNewsEmphasis('[급보] 증시 개장 직후 급락') === 'breaking',
  );
  check(
    '[단독] 금융당국... -> exclusive',
    parseHomeNewsEmphasis('[단독] 금융당국 규제 검토') === 'exclusive',
  );
  check(
    'leading whitespace + [속보] -> breaking',
    parseHomeNewsEmphasis('  [속보] 환율 급등') === 'breaking',
  );
  check(
    'leading whitespace + [단독] -> exclusive',
    parseHomeNewsEmphasis('   [단독] 단독 보도 기사') === 'exclusive',
  );
  check('오늘 [속보]... -> null (prefix not at start)', parseHomeNewsEmphasis('오늘 [속보]라고 전한 기사') === null);
  check('[속보성]... -> null (near-miss, not exact prefix)', parseHomeNewsEmphasis('[속보성] 임시 기사') === null);
  check('[종합]... -> null (unrecognized bracket)', parseHomeNewsEmphasis('[종합] 오늘의 증시 종합') === null);
  check('empty title -> null', parseHomeNewsEmphasis('') === null);
  check('plain title -> null', parseHomeNewsEmphasis('코스피 2600선 회복') === null);
  check(
    '[긴급속보]... -> null (not one of the exact whitelisted prefixes)',
    parseHomeNewsEmphasis('[긴급속보] 임시 기사') === null,
  );

  // --- §8 rendered class/badge decision -----------------------------------
  {
    const emphasis = parseHomeNewsEmphasis('[속보] 코스피 급등');
    check('breaking -> card modifier class', getHomeNewsEmphasisCardClass(emphasis) === 'home-news-card--breaking');
    check('breaking -> badge label 속보', getHomeNewsEmphasisBadgeLabel(emphasis) === '속보');
  }
  {
    const emphasis = parseHomeNewsEmphasis('[단독] 금융당국 발표');
    check('exclusive -> card modifier class', getHomeNewsEmphasisCardClass(emphasis) === 'home-news-card--exclusive');
    check('exclusive -> badge label 단독', getHomeNewsEmphasisBadgeLabel(emphasis) === '단독');
  }
  {
    const emphasis = parseHomeNewsEmphasis('코스피 2600선 회복');
    check('normal -> no card modifier class', getHomeNewsEmphasisCardClass(emphasis) === null);
    check('normal -> no badge label', getHomeNewsEmphasisBadgeLabel(emphasis) === null);
  }

  // --- display-title derivation (accessible-name preservation contract) --
  {
    const title = '[속보] 코스피 급등';
    const emphasis = parseHomeNewsEmphasis(title);
    check(
      'breaking display title strips only the recognized prefix',
      deriveHomeNewsDisplayTitle(title, emphasis) === '코스피 급등',
    );
    check('original title string itself is untouched by derivation', title === '[속보] 코스피 급등');
  }
  {
    const title = '오늘 [속보]라고 전한 기사';
    const emphasis = parseHomeNewsEmphasis(title);
    check('non-matching title -> display title equals original', deriveHomeNewsDisplayTitle(title, emphasis) === title);
  }
  {
    // Edge case: title is only the prefix -- stripping would leave an empty headline, so the
    // original title is kept instead of ever rendering a blank headline.
    const title = '[속보]';
    const emphasis = parseHomeNewsEmphasis(title);
    check(
      'prefix-only title falls back to original (never renders blank headline)',
      deriveHomeNewsDisplayTitle(title, emphasis) === '[속보]',
    );
  }
  check('null emphasis -> display title always equals original', deriveHomeNewsDisplayTitle('일반 기사 제목', null) === '일반 기사 제목');

  console.log(`\nphase_4f_ux1b_home_news_emphasis_testsrc: ${passed} passed, ${failed} failed`);
  return failed === 0 ? 0 : 1;
};
