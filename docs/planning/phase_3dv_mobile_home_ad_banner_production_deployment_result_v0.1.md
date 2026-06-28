# Phase 3DV — Mobile Home Ad Banner Production Deployment Result

## 1. Status

Deployed to production.

## 2. Deployment Baseline

- Branch: `rebuild/phase-1-ia-shell`
- Deployed source baseline: `ec41d41 docs: close out mobile home ad banner owner review`
- Canonical production URL: `https://mkstocklab.vercel.app`
- Vercel project target: `mkstocklab`
- Temporary/non-canonical project created: no
- Pre-existing non-canonical project used: no
- Deployment documentation commit included in deployed artifact: no

## 3. Deployed Scope

- PC Home rail banner slots expanded to 5
- Mobile Home banner slots added, 5 slots
- MyPage PC/mobile banner admin accepted
- PC banner persistence HF2 accepted
- Mobile placement between `MY PORTFOLIO` and `MARKET SNAPSHOT` accepted
- Responsive visibility through 859px and hidden at 860px+ accepted
- PC rail 1440px+ regression accepted
- Zero, one, and multiple banner states accepted
- 5000ms rotation behavior accepted
- URL-only workflow preserved
- No file upload UI added
- Legacy array-shaped and object-shaped banner storage compatibility preserved

## 4. Validation Before Deployment

- `npm run check:phase-3du-owner-review-closeout`: PASS — 40/40
- `npm run check:phase-3du-hf2-banner-admin-persistence`: PASS — 43/43
- `npm run check:phase-3du-mobile-home-ad-banner`: PASS — 59/59
- `npm run check:home-rail-banner-settings`: PASS — 111/111
- `npm run check:home-ad-slots`: PASS
- `npm run check:production-domain`: PASS — 33/33
- `npm run build`: PASS
- `git diff --check`: PASS

## 5. Deployment

- Deployment command: `vercel --prod --yes`
- Deployment URL: `https://mkstocklab-3k7qvo5tk-sbchangkyun-2946s-projects.vercel.app`
- Canonical alias: `https://mkstocklab.vercel.app`
- Vercel project: `mkstocklab`
- Deployment inspection: READY
- Deployment result: PASS

The local repository was explicitly linked to the existing canonical project before deployment. Vercel CLI 54 stored the sanitized repository link in `.vercel/repo.json`. No internal project or organization IDs are recorded here.

## 6. Post-Deploy Public Checks

- `https://mkstocklab.vercel.app`: HTTP 200; canonical URL retained
- `https://mkstocklab.vercel.app/mypage`: HTTP 200; canonical URL retained
- Canonical project confirmed: PASS
- Wrong temporary project used: no
- New temporary project created: no
- Browser login/admin save test by Codex: not performed

## 7. Safety

- No secrets were read or printed.
- No live Supabase database rows were inspected.
- No SQL was executed and no migration was added.
- No Supabase Storage upload was performed.
- No Vercel environment variable or project setting was changed.
- No browser automation was run.
- No live credential-dependent smoke script was run.
- No external provider API was called outside Vercel deployment/inspection and public production HTTP checks.
- No push was performed.

## 8. Owner Post-Deploy Check

Owner post-deploy check is pending. The owner should manually confirm:

- Home mobile banner appears correctly when active mobile banners exist.
- Mobile banner remains hidden at 860px+.
- PC rail appears at 1440px+ when active PC banners exist.
- MyPage PC/mobile banner admin is accessible for the master account.
- PC banner save persistence remains fixed.
- No private URLs, secrets, raw database rows, or session data are shared in the result.
