/**
 * Phase 3GG-T-HF2: durable KIS token lifecycle configuration (env contract).
 *
 * Reads env by NAME only — real values are never logged or returned in a printable form. The decoded
 * encryption key is returned as a Buffer and must never be logged. Missing KIS_DURABLE_TOKEN_ENABLED
 * ⇒ durable mode OFF (preserves the existing L1-only behavior).
 */

type EnvReader = (name: string) => string | undefined;

const defaultEnvReader: EnvReader = (name) => {
  const fromProcess = process.env[name];
  if (typeof fromProcess === 'string' && fromProcess.trim().length > 0) return fromProcess;
  return undefined;
};

const isTrue = (raw: string | undefined): boolean => {
  if (typeof raw !== 'string') return false;
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
};

const readIntSeconds = (raw: string | undefined, fallbackSeconds: number): number => {
  if (typeof raw !== 'string') return fallbackSeconds;
  const n = Number(raw.trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallbackSeconds;
};

export interface KisDurableTokenConfig {
  durableEnabled: boolean;
  namespace: string;
  scopeKey: string;
  telemetryEnabled: boolean;
  emergencyRefreshEnabled: boolean;
  encryptionKeyPresent: boolean;
  encryptionKeyVersion: number;
  safetyWindowMs: number;
  leaseTtlMs: number;
  leaseTtlSeconds: number;
  waitTimeoutMs: number;
  issueCooldownMs: number;
  tokenEndpointTimeoutMs: number;
  /** true only when durable mode is on AND a valid 32-byte key is present. */
  durableReady: boolean;
  /** durable requested but not usable (e.g. missing/invalid key) — caller must fail closed, not issue. */
  durableMisconfigured: boolean;
}

/** Build the stable, non-secret scope key. Never includes the app key or its hash. */
export const buildScopeKey = (namespace: string): string => `kis:market-data:${namespace}:v1`;

/**
 * Decode + validate KIS_TOKEN_ENCRYPTION_KEY (base64, exactly 32 bytes). Returns null if absent/invalid.
 * Never logs the key or derived material.
 */
export const decodeEncryptionKey = (raw: string | undefined): Buffer | null => {
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  let decoded: Buffer;
  try {
    decoded = Buffer.from(raw.trim(), 'base64');
  } catch {
    return null;
  }
  if (decoded.length !== 32) return null;
  return decoded;
};

export const resolveKisDurableTokenConfig = (envReader: EnvReader = defaultEnvReader): KisDurableTokenConfig => {
  const durableEnabled = isTrue(envReader('KIS_DURABLE_TOKEN_ENABLED'));
  const namespace = (envReader('KIS_TOKEN_NAMESPACE') ?? 'default').trim() || 'default';
  const telemetryEnabled = isTrue(envReader('KIS_TOKEN_TELEMETRY_ENABLED'));
  const emergencyRefreshEnabled = isTrue(envReader('KIS_TOKEN_EMERGENCY_REFRESH_ENABLED')); // default false
  const encryptionKey = decodeEncryptionKey(envReader('KIS_TOKEN_ENCRYPTION_KEY'));
  const encryptionKeyPresent = encryptionKey !== null;

  const safetyWindowMs = readIntSeconds(envReader('KIS_TOKEN_SAFETY_WINDOW_SECONDS'), 15 * 60) * 1000;
  const leaseTtlSeconds = readIntSeconds(envReader('KIS_TOKEN_LEASE_TTL_SECONDS'), 20);
  const waitTimeoutMs = readIntSeconds(envReader('KIS_TOKEN_WAIT_TIMEOUT_SECONDS'), 10) * 1000;
  const issueCooldownMs = readIntSeconds(envReader('KIS_TOKEN_ISSUE_COOLDOWN_SECONDS'), 10 * 60) * 1000;

  const durableReady = durableEnabled && encryptionKeyPresent;
  const durableMisconfigured = durableEnabled && !encryptionKeyPresent;

  return {
    durableEnabled,
    namespace,
    scopeKey: buildScopeKey(namespace),
    telemetryEnabled,
    emergencyRefreshEnabled,
    encryptionKeyPresent,
    encryptionKeyVersion: 1,
    safetyWindowMs,
    leaseTtlMs: leaseTtlSeconds * 1000,
    leaseTtlSeconds,
    waitTimeoutMs,
    issueCooldownMs,
    tokenEndpointTimeoutMs: 8000,
    durableReady,
    durableMisconfigured,
  };
};

/** Fetch the decoded key on demand (server-only). Kept separate so config never carries the raw key. */
export const getEncryptionKey = (envReader: EnvReader = defaultEnvReader): Buffer | null =>
  decodeEncryptionKey(envReader('KIS_TOKEN_ENCRYPTION_KEY'));
