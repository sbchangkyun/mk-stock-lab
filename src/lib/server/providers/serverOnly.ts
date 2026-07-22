import { createProviderError } from './providerErrors';

export class ServerOnlyRuntimeError extends Error {
  envelope = createProviderError('INTERNAL_ERROR', 'Server-only provider module cannot run in a browser runtime.');

  constructor(moduleName: string) {
    super(`Server-only provider module cannot run in a browser runtime: ${moduleName}`);
    this.name = 'ServerOnlyRuntimeError';
  }
}

export const assertServerRuntime = (moduleName: string): void => {
  if (typeof window !== 'undefined') {
    throw new ServerOnlyRuntimeError(moduleName);
  }
};
