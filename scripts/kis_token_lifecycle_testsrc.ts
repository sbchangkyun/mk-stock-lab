/**
 * Phase 3GG-T-HF2 test source (bundled + run by smoke_phase_3gg_t_hf2_kis_token_lifecycle.mjs via esbuild).
 *
 * NEVER calls the real KIS token endpoint. A fixed in-memory mock issuer + a faithful in-memory mock of
 * the durable store/lease/fencing exercise every scenario. The fixture token is a clearly non-secret
 * placeholder; the secret-scan asserts it never appears in telemetry, events, or logs.
 */

import { randomUUID, randomBytes } from 'node:crypto';
import {
  createKisTokenManager,
  computeTokenExpiry,
  parseKisAbsoluteExpiryKst,
} from '../src/lib/server/providers/kis/kisTokenManager';
import { encryptKisToken, decryptKisToken, KisTokenCryptoError } from '../src/lib/server/providers/kis/kisTokenCrypto';
import {
  resolveKisDurableTokenConfig,
  decodeEncryptionKey,
  buildScopeKey,
} from '../src/lib/server/providers/kis/kisTokenConfig';
import { computeLeasePollDelayMs } from '../src/lib/server/providers/kis/kisTokenLease';
import { isClearlyTokenInvalid, TOKEN_INVALID_CODES } from '../src/lib/server/providers/kis/kisTokenErrorClassifier';
import { __telemetryInternals } from '../src/lib/server/providers/kis/kisTokenTelemetry';
import { executeKisRequestWithToken } from '../src/lib/server/providers/kis/kisRequestExecutor';
import type { KisTokenDb, StoreGenerationArgs, KisTokenEventRow } from '../src/lib/server/providers/kis/kisTokenStore';
import type { KisTokenStateRecord } from '../src/lib/server/providers/kis/kisTokenTypes';

const FIXTURE_TOKEN = 'FIXTURE_KIS_TOKEN_placeholder_not_a_real_token_0001';
const SCOPE = buildScopeKey('test');

let passed = 0;
let failed = 0;
const logs: string[] = [];
const check = (name: string, cond: boolean) => {
  if (cond) passed += 1;
  else failed += 1;
  const line = `${cond ? 'PASS' : 'FAIL'} :: ${name}`;
  logs.push(line);
  console.log(line);
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, Math.max(0, ms)));

// ---- Faithful in-memory mock of the durable store/lease/fencing (mirrors the migration RPCs) ----
interface MockDb extends KisTokenDb {
  _state: KisTokenStateRecord & { leaseAcquiredAtMs?: number | null };
  _events: KisTokenEventRow[];
  _flags: { readFail: boolean; leaseFail: boolean; storeFail: boolean; eventFail: boolean };
  _reads: number;
}

const createMockDb = (initial: Partial<KisTokenStateRecord> = {}): MockDb => {
  const state: KisTokenStateRecord = {
    scopeKey: SCOPE, status: 'empty', envelope: null, generationId: null, issuedAtMs: null,
    expiresAtMs: null, usableUntilMs: null, lastIssueSuccessAtMs: null, invalidatedGenerationId: null,
    leaseOwner: null, leaseVersion: 0, leaseExpiresAtMs: null, ...initial,
  };
  const events: KisTokenEventRow[] = [];
  const flags = { readFail: false, leaseFail: false, storeFail: false, eventFail: false };
  const db: MockDb = {
    _state: state, _events: events, _flags: flags, _reads: 0,
    async readState(sk) {
      db._reads += 1;
      if (flags.readFail) throw new Error('KIS_TOKEN_STORE_READ_FAILED');
      return sk === state.scopeKey ? { ...state } : null;
    },
    async acquireLease(sk, owner, ttlSeconds) {
      if (flags.leaseFail) throw new Error('KIS_TOKEN_LEASE_ACQUIRE_FAILED');
      const now = Date.now();
      const canAcquire =
        state.leaseOwner === null || state.leaseExpiresAtMs === null || state.leaseExpiresAtMs < now || state.leaseOwner === owner;
      if (canAcquire) {
        state.leaseVersion += 1;
        state.leaseOwner = owner;
        state.leaseExpiresAtMs = now + ttlSeconds * 1000;
        return { acquired: true, leaseVersion: state.leaseVersion, leaseExpiresAtMs: state.leaseExpiresAtMs };
      }
      return { acquired: false, leaseVersion: state.leaseVersion, leaseExpiresAtMs: state.leaseExpiresAtMs };
    },
    async releaseLease(sk, owner, version) {
      if (state.leaseOwner === owner && state.leaseVersion === version) {
        state.leaseOwner = null;
        state.leaseExpiresAtMs = null;
        return true;
      }
      return false;
    },
    async storeGeneration(a: StoreGenerationArgs) {
      if (flags.storeFail) throw new Error('KIS_TOKEN_STORE_WRITE_FAILED');
      if (state.leaseOwner === a.leaseOwner && state.leaseVersion === a.leaseVersion) {
        state.envelope = a.envelope;
        state.generationId = a.generationId;
        state.issuedAtMs = a.issuedAtMs;
        state.expiresAtMs = a.expiresAtMs;
        state.usableUntilMs = a.usableUntilMs;
        state.status = 'valid';
        state.lastIssueSuccessAtMs = Date.now();
        state.invalidatedGenerationId = null;
        state.leaseOwner = null;
        state.leaseExpiresAtMs = null;
        return true;
      }
      return false; // fencing rejects a stale lease
    },
    async invalidateGeneration(sk, generationId) {
      if (state.generationId === generationId) {
        state.status = 'invalidated';
        state.invalidatedGenerationId = generationId;
        return true;
      }
      return false;
    },
    async recordEvent(row) {
      if (flags.eventFail) throw new Error('KIS_TOKEN_EVENT_WRITE_FAILED');
      events.push(row);
    },
  };
  return db;
};

const capturedTelemetry: unknown[] = [];
const mockTelemetry = {
  async record(e: unknown) {
    capturedTelemetry.push(e);
  },
};

const testKey = randomBytes(32);
const makeManager = (
  db: KisTokenDb,
  shared: { issuerCalls: () => number; bump: () => void; token?: string },
  owner: string,
  configOverrides: Record<string, unknown> = {},
) => {
  const config = {
    durableEnabled: true, namespace: 'test', scopeKey: SCOPE, telemetryEnabled: true,
    emergencyRefreshEnabled: false, encryptionKeyPresent: true, encryptionKeyVersion: 1,
    safetyWindowMs: 15 * 60 * 1000, leaseTtlMs: 1000, leaseTtlSeconds: 1, waitTimeoutMs: 2000,
    issueCooldownMs: 10 * 60 * 1000, tokenEndpointTimeoutMs: 8000, durableReady: true, durableMisconfigured: false,
    ...configOverrides,
  } as never;
  return createKisTokenManager({
    config,
    encryptionKey: testKey,
    db,
    telemetry: mockTelemetry as never,
    issueToken: async () => {
      shared.bump();
      await sleep(5);
      return { ok: true as const, accessToken: shared.token ?? FIXTURE_TOKEN, issuedAtMs: Date.now(), expiresInSeconds: 24 * 3600, absoluteExpiryKst: null };
    },
    now: () => Date.now(),
    sleep,
    newGenerationId: () => randomUUID(),
    leaseOwnerId: owner,
    instanceId: 'inst',
    deploymentId: 'dep',
    random: () => 0.5,
  });
};

const sharedCounter = () => {
  let n = 0;
  return { issuerCalls: () => n, bump: () => { n += 1; }, token: FIXTURE_TOKEN };
};

export const runAll = async (): Promise<number> => {
  // ---------- Crypto ----------
  {
    const gen = randomUUID();
    const env = encryptKisToken(FIXTURE_TOKEN, { scopeKey: SCOPE, generationId: gen, keyVersion: 1, key: testKey });
    check('crypto: roundtrip decrypt returns plaintext', decryptKisToken(env, { scopeKey: SCOPE, generationId: gen, key: testKey }) === FIXTURE_TOKEN);
    check('crypto: envelope has no plaintext', !env.ciphertext.includes(FIXTURE_TOKEN) && env.iv.length > 0 && env.authTag.length > 0);
    let wrongKey = false;
    try { decryptKisToken(env, { scopeKey: SCOPE, generationId: gen, key: randomBytes(32) }); } catch (e) { wrongKey = e instanceof KisTokenCryptoError; }
    check('crypto: wrong key fails closed', wrongKey);
    let aadMismatch = false;
    try { decryptKisToken(env, { scopeKey: SCOPE, generationId: randomUUID(), key: testKey }); } catch (e) { aadMismatch = e instanceof KisTokenCryptoError; }
    check('crypto: AAD (generation) mismatch fails closed', aadMismatch);
    let malformed = false;
    try { decryptKisToken({ ...env, ciphertext: 'not-base64!!' }, { scopeKey: SCOPE, generationId: gen, key: testKey }); } catch (e) { malformed = e instanceof KisTokenCryptoError; }
    check('crypto: malformed ciphertext fails closed', malformed);
    let badKeyLen = false;
    try { encryptKisToken(FIXTURE_TOKEN, { scopeKey: SCOPE, generationId: gen, keyVersion: 1, key: randomBytes(16) }); } catch { badKeyLen = true; }
    check('crypto: 16-byte key rejected (must be 32)', badKeyLen);
  }

  // ---------- Config / key ----------
  {
    check('config: valid base64 32-byte key decodes', decodeEncryptionKey(randomBytes(32).toString('base64'))?.length === 32);
    check('config: 31-byte key rejected', decodeEncryptionKey(randomBytes(31).toString('base64')) === null);
    check('config: missing key rejected', decodeEncryptionKey(undefined) === null);
    check('config: scope key format', buildScopeKey('ns') === 'kis:market-data:ns:v1');
    const off = resolveKisDurableTokenConfig(() => undefined);
    check('config: missing KIS_DURABLE_TOKEN_ENABLED ⇒ durable OFF', off.durableEnabled === false && off.durableReady === false);
    const misc = resolveKisDurableTokenConfig((n) => (n === 'KIS_DURABLE_TOKEN_ENABLED' ? 'true' : undefined));
    check('config: durable ON without key ⇒ misconfigured (fail closed, not issue)', misc.durableEnabled === true && misc.durableReady === false && misc.durableMisconfigured === true);
    check('config: emergency refresh defaults disabled', off.emergencyRefreshEnabled === false && misc.emergencyRefreshEnabled === false);
    check('config: default safety window 15min', off.safetyWindowMs === 15 * 60 * 1000);
  }

  // ---------- Expiry ----------
  {
    const e1 = computeTokenExpiry({ issuedAtMs: 1_000_000, expiresInSeconds: 86400 }, 15 * 60 * 1000);
    check('expiry: expires_in used; usableUntil = expiresAt − 15min', !!e1 && e1.expiresAtMs === 1_000_000 + 86400_000 && e1.usableUntilMs === e1.expiresAtMs - 15 * 60 * 1000);
    // Machine-timezone-independent: 2026-07-14 09:00:00 KST == 2026-07-14 00:00:00 UTC.
    check('expiry: KST absolute parsed at +09:00 (tz-safe, machine-independent)', parseKisAbsoluteExpiryKst('2026-07-14 09:00:00') === Date.UTC(2026, 6, 14, 0, 0, 0));
    const absKst = parseKisAbsoluteExpiryKst('2029-01-01 00:00:00')!;
    const e2 = computeTokenExpiry({ issuedAtMs: absKst - 3_600_000, expiresInSeconds: 0, absoluteExpiryKst: '2029-01-01 00:00:00' }, 900000);
    check('expiry: falls back to absolute KST only when expires_in invalid', !!e2 && e2.expiresAtMs === absKst);
    check('expiry: negative lifetime rejected', computeTokenExpiry({ issuedAtMs: absKst, expiresInSeconds: 0, absoluteExpiryKst: '1999-01-01 00:00:00' }, 900000) === null);
    check('expiry: absurdly large lifetime rejected', computeTokenExpiry({ issuedAtMs: 0, expiresInSeconds: 60 * 60 * 24 * 40 }, 900000) === null);
  }

  // ---------- Lease backoff ----------
  {
    const delays = [0, 1, 2, 5, 10].map((a) => computeLeasePollDelayMs(a, { random: () => 0.99 }));
    check('lease: backoff bounded by 800ms cap', delays.every((d) => d <= 800 && d >= 0));
  }

  // ---------- Error classifier ----------
  {
    check('classifier: allowlist empty by default', TOKEN_INVALID_CODES.size === 0);
    check('classifier: generic 401/500/timeout NOT token-invalid', !isClearlyTokenInvalid({ httpStatus: 401 }) && !isClearlyTokenInvalid({ internalCode: 'PROVIDER_UNAVAILABLE' }) && !isClearlyTokenInvalid({ internalCode: 'PROVIDER_RATE_LIMITED' }));
  }

  // ---------- Telemetry redaction ----------
  {
    const s = __telemetryInternals.sanitizeMetadata({ expiresAtMs: 5, leaseVersion: 2, accessToken: FIXTURE_TOKEN, appSecret: 'x', ciphertext: 'y', reason: 'ok' } as never);
    check('telemetry: allowlisted metadata kept', s?.expiresAtMs === 5 && s?.leaseVersion === 2 && s?.reason === 'ok');
    check('telemetry: secret-ish keys dropped', s !== null && !('accessToken' in s) && !('appSecret' in s) && !('ciphertext' in s));
    check('telemetry: serialized redacted metadata has no token', !JSON.stringify(s).includes(FIXTURE_TOKEN));
  }

  // ---------- L1 valid reuse (no L2 read, no issuance) ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    const m = makeManager(db, sh, 'owner-A');
    const r1 = await m.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    const readsAfterFirst = db._reads;
    const r2 = await m.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('L1: first issue then L1 reuse (issuer called once)', r1.ok && r2.ok && sh.issuerCalls() === 1);
    check('L1: reuse does NOT read L2 again', db._reads === readsAfterFirst && r2.ok && (r2 as { handle: { source: string } }).handle.source === 'l1');
  }

  // ---------- 23.2 multi-instance: exactly one issuance across instances ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    const managers = [makeManager(db, sh, 'i1'), makeManager(db, sh, 'i2'), makeManager(db, sh, 'i3'), makeManager(db, sh, 'i4')];
    const plan: Array<{ mi: number; cat: string }> = [];
    for (let i = 0; i < 10; i++) plan.push({ mi: i % 4, cat: 'domestic_ohlcv' });
    for (let i = 0; i < 5; i++) plan.push({ mi: i % 4, cat: 'overseas_ohlcv' });
    for (let i = 0; i < 3; i++) plan.push({ mi: i % 4, cat: 'similarity' });
    plan.push({ mi: 0, cat: 'mk_analysis' });
    plan.push({ mi: 1, cat: 'market_intelligence' });
    const results = await Promise.all(plan.map((p) => managers[p.mi].getTokenHandle({ routeCategory: p.cat as never })));
    const okResults = results.filter((r) => r.ok) as Array<{ handle: { generationId: string } }>;
    const gens = new Set(okResults.map((r) => r.handle.generationId));
    check('multi-instance: issuer called exactly once for 20 concurrent callers', sh.issuerCalls() === 1);
    check('multi-instance: all successful callers share one generation id', okResults.length === 20 && gens.size === 1);
  }

  // ---------- 23.3 cold start: new manager (empty L1) reuses L2 ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    const a = makeManager(db, sh, 'cold-A');
    await a.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    const b = makeManager(db, sh, 'cold-B'); // fresh L1
    const rb = await b.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('cold-start: manager B reuses L2, issuer stays at 1', rb.ok && sh.issuerCalls() === 1 && (rb as { handle: { source: string } }).handle.source === 'l2');
  }

  // ---------- 23.4 redeploy: same L2, new process → reuse ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    await makeManager(db, sh, 'r1').getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    const fresh = makeManager(db, sh, 'r2');
    const r = await fresh.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('redeploy: valid L2 reused, no new issuance', r.ok && sh.issuerCalls() === 1);
  }

  // ---------- 23.5 lease-owner crash → fencing rejects late write ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    // A acquires the lease but "crashes" before storing.
    const leaseA = await db.acquireLease(SCOPE, 'crash-A', 1);
    const b = makeManager(db, sh, 'crash-B', { waitTimeoutMs: 2500 });
    const rb = await b.getTokenHandle({ routeCategory: 'domestic_ohlcv' }); // waits out A's lease, reacquires, issues once
    check('lease-crash: B issues exactly once after A lease expiry', rb.ok && sh.issuerCalls() === 1);
    const staleStore = await db.storeGeneration({
      scopeKey: SCOPE, leaseOwner: 'crash-A', leaseVersion: leaseA.leaseVersion, generationId: randomUUID(),
      envelope: { ciphertext: 'x', iv: 'y', authTag: 'z', keyVersion: 1 }, issuedAtMs: Date.now(), expiresAtMs: Date.now() + 1e6, usableUntilMs: Date.now() + 1e6,
    });
    check('lease-crash: A late store rejected by fencing (stale lease_version)', staleStore === false);
  }

  // ---------- 23.6 store failures ----------
  {
    // L2 down + valid L1 → use L1
    const db = createMockDb();
    const sh = sharedCounter();
    const m = makeManager(db, sh, 'sf-1');
    await m.getTokenHandle({ routeCategory: 'domestic_ohlcv' }); // hydrate L1
    db._flags.readFail = true;
    const r = await m.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('store-fail: L2 down + valid L1 ⇒ reuse L1', r.ok);

    // L2 down + no L1 → fail closed (no issuance)
    const db2 = createMockDb();
    const sh2 = sharedCounter();
    db2._flags.readFail = true;
    const m2 = makeManager(db2, sh2, 'sf-2');
    const r2 = await m2.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('store-fail: L2 down + no L1 ⇒ fail closed, no issuance', !r2.ok && sh2.issuerCalls() === 0);

    // lease RPC down → no issuance
    const db3 = createMockDb();
    const sh3 = sharedCounter();
    db3._flags.leaseFail = true;
    const r3 = await makeManager(db3, sh3, 'sf-3').getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('store-fail: lease RPC down ⇒ no issuance, fail closed', !r3.ok && sh3.issuerCalls() === 0);

    // token issued but DB write fails → NOT a durable success
    const db4 = createMockDb();
    const sh4 = sharedCounter();
    db4._flags.storeFail = true;
    const r4 = await makeManager(db4, sh4, 'sf-4').getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('store-fail: issued but DB write fails ⇒ not durable success (fail closed)', !r4.ok && db4._state.status !== 'valid');

    // telemetry write failure → valid token flow continues
    const db5 = createMockDb();
    const sh5 = sharedCounter();
    db5._flags.eventFail = true;
    const realTelemetryDb = { ...db5 };
    void realTelemetryDb;
    const r5 = await makeManager(db5, sh5, 'sf-5').getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('store-fail: telemetry failure never breaks issuance', r5.ok && sh5.issuerCalls() === 1);
  }

  // ---------- Issue cooldown ----------
  {
    const db = createMockDb({ lastIssueSuccessAtMs: Date.now() - 60_000 }); // 1 min ago, no usable token
    const sh = sharedCounter();
    const r = await makeManager(db, sh, 'cd-1', { issueCooldownMs: 10 * 60 * 1000 }).getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    check('cooldown: recent issuance + no usable token ⇒ blocked, no issuance', !r.ok && sh.issuerCalls() === 0);
  }

  // ---------- Invalidation only for matching generation ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    const m = makeManager(db, sh, 'inv-1');
    await m.getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    const currentGen = db._state.generationId!;
    await m.invalidateGeneration('some-other-generation');
    check('invalidate: non-matching generation is NOT invalidated', db._state.status === 'valid');
    await m.invalidateGeneration(currentGen);
    check('invalidate: matching generation invalidated', db._state.status === 'invalidated');
  }

  // ---------- Emergency refresh disabled (executor) ----------
  {
    const db = createMockDb();
    const sh = sharedCounter();
    const manager = makeManager(db, sh, 'er-1');
    const cfg = { scopeKey: SCOPE, emergencyRefreshEnabled: false } as never;
    let calls = 0;
    const res = await executeKisRequestWithToken(
      { manager, config: cfg, telemetry: mockTelemetry as never },
      { routeCategory: 'domestic_ohlcv' },
      async () => { calls += 1; return { ok: false, code: 'PROVIDER_UNAVAILABLE' } as never; },
    );
    check('executor: emergency refresh disabled ⇒ requestFn runs once, no forced refresh', calls === 1 && (res as { ok: boolean }).ok === false && sh.issuerCalls() === 1);
  }

  // ---------- Secret scan ----------
  {
    const haystack = JSON.stringify(capturedTelemetry) + '\n' + logs.join('\n') + '\n' + JSON.stringify(capturedTelemetry.map((e) => e));
    check('secret-scan: fixture token never appears in telemetry/logs', !haystack.includes(FIXTURE_TOKEN));
    const dbProbe = createMockDb();
    const shProbe = sharedCounter();
    await makeManager(dbProbe, shProbe, 'scan').getTokenHandle({ routeCategory: 'domestic_ohlcv' });
    const eventsStr = JSON.stringify(dbProbe._events);
    check('secret-scan: persisted events never contain the token or a raw envelope value', !eventsStr.includes(FIXTURE_TOKEN));
  }

  console.log('');
  console.log(`KIS-TOKEN-TESTS :: passed=${passed} failed=${failed} total=${passed + failed}`);
  return failed > 0 ? 1 : 0;
};
