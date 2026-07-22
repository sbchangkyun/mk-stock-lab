// Phase 3FG-A guarded productization scaffold fixtures. Deterministic,
// server-only request builders for the scaffold in
// guarded-productization-scaffold.mjs. No secrets, no env values, no raw
// user identifiers, no email addresses, no JWT-like values.

import { createDefaultGuardedProductizationFlags } from './guarded-productization-scaffold.mjs';

export function createDefaultGuardedProductizationFixture() {
  return {
    audience: 'owner-local',
    providerMode: 'synthetic_fixture',
    agentMode: 'deterministic_fixture',
    flags: createDefaultGuardedProductizationFlags(),
    scaffoldOnlyAcknowledged: false,
  };
}

export function createOwnerLocalFixtureRequest() {
  return {
    audience: 'owner-local',
    providerMode: 'synthetic_fixture',
    agentMode: 'deterministic_fixture',
    flags: { ...createDefaultGuardedProductizationFlags(), ownerLocalEnabled: true },
    scaffoldOnlyAcknowledged: false,
  };
}

export function createBetaAttemptFixtureRequest() {
  return {
    audience: 'beta',
    providerMode: 'synthetic_fixture',
    agentMode: 'deterministic_fixture',
    flags: { ...createDefaultGuardedProductizationFlags(), betaEnabled: true },
    scaffoldOnlyAcknowledged: false,
  };
}

export function createPublicAttemptFixtureRequest() {
  return {
    audience: 'public',
    providerMode: 'synthetic_fixture',
    agentMode: 'deterministic_fixture',
    flags: { ...createDefaultGuardedProductizationFlags(), publicEnabled: true },
    scaffoldOnlyAcknowledged: false,
  };
}

export function createLiveKisAttemptFixtureRequest() {
  return {
    audience: 'owner-local',
    providerMode: 'live_kis',
    agentMode: 'deterministic_fixture',
    flags: { ...createDefaultGuardedProductizationFlags(), liveKisEnabled: true },
    scaffoldOnlyAcknowledged: false,
  };
}

export function createLlmAttemptFixtureRequest() {
  return {
    audience: 'owner-local',
    providerMode: 'synthetic_fixture',
    agentMode: 'llm',
    flags: { ...createDefaultGuardedProductizationFlags(), llmEnabled: true },
    scaffoldOnlyAcknowledged: false,
  };
}

export function createRealAuthAttemptFixtureRequest() {
  return {
    audience: 'owner-local',
    providerMode: 'synthetic_fixture',
    agentMode: 'deterministic_fixture',
    flags: { ...createDefaultGuardedProductizationFlags(), realAuthEnabled: true },
    scaffoldOnlyAcknowledged: false,
  };
}
