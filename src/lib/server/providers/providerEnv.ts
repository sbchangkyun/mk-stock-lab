import type { ProviderName } from './types';

export type ProviderEnvName =
  | 'KIS_APP_KEY'
  | 'KIS_APP_SECRET'
  | 'KIS_BASE_URL'
  | 'KIS_ENABLE_LIVE_QUOTES'
  | 'KIS_ENABLE_PREVIEW_LIVE_QUOTES'
  | 'KIS_ACCOUNT_NO'
  | 'OPENDART_API_KEY'
  | 'OPENAI_API_KEY'
  | 'GEMINI_API_KEY';

export type ProviderEnvMetadata = {
  name: ProviderEnvName;
  provider: ProviderName;
  owner: 'owner' | 'engineering';
  serverOnly: true;
  browserSafe: false;
  requiredPhase: string;
  shouldLogValue: false;
  productionAllowed?: false;
  optional?: boolean;
};

export const providerEnvRegistry: ProviderEnvMetadata[] = [
  { name: 'KIS_APP_KEY', provider: 'kis', owner: 'owner', serverOnly: true, browserSafe: false, requiredPhase: '3I', shouldLogValue: false, productionAllowed: false },
  { name: 'KIS_APP_SECRET', provider: 'kis', owner: 'owner', serverOnly: true, browserSafe: false, requiredPhase: '3I', shouldLogValue: false, productionAllowed: false },
  { name: 'KIS_BASE_URL', provider: 'kis', owner: 'engineering', serverOnly: true, browserSafe: false, requiredPhase: '3I', shouldLogValue: false, productionAllowed: false },
  { name: 'KIS_ENABLE_LIVE_QUOTES', provider: 'kis', owner: 'engineering', serverOnly: true, browserSafe: false, requiredPhase: '3I', shouldLogValue: false, productionAllowed: false },
  { name: 'KIS_ENABLE_PREVIEW_LIVE_QUOTES', provider: 'kis', owner: 'engineering', serverOnly: true, browserSafe: false, requiredPhase: '3AE', shouldLogValue: false, productionAllowed: false },
  { name: 'KIS_ACCOUNT_NO', provider: 'kis', owner: 'owner', serverOnly: true, browserSafe: false, requiredPhase: 'future-account-context', shouldLogValue: false, optional: true },
  { name: 'OPENDART_API_KEY', provider: 'opendart', owner: 'owner', serverOnly: true, browserSafe: false, requiredPhase: '3O', shouldLogValue: false },
  { name: 'OPENAI_API_KEY', provider: 'openai', owner: 'owner', serverOnly: true, browserSafe: false, requiredPhase: '3N', shouldLogValue: false },
  { name: 'GEMINI_API_KEY', provider: 'gemini', owner: 'owner', serverOnly: true, browserSafe: false, requiredPhase: '3N', shouldLogValue: false },
];

export const getProviderEnvNames = (provider: ProviderName) =>
  providerEnvRegistry.filter((item) => item.provider === provider).map((item) => item.name);
