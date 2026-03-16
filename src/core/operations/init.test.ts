import { describe, expect, it } from 'vitest';
import ensureOperationsInitialized from './init';

describe('ensureOperationsInitialized', () => {
  it('returns early in test runtime', async () => {
    await expect(ensureOperationsInitialized()).resolves.toBeUndefined();
  });
});
