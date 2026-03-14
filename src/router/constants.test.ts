import { describe, expect, it } from 'vitest';
import { createNavigation, moduleIdToPath, pathToModuleId } from './constants';

describe('router/constants', () => {
  it('creates stable module navigation paths', () => {
    expect(createNavigation.encoder('base64')).toBe('/encoder/base64');
    expect(createNavigation.crypto('hash')).toBe('/crypto/hash');
    expect(createNavigation.formatter('http')).toBe('/formatter/http');
    expect(createNavigation.recipe()).toBe('/recipe');
  });

  it('keeps id-path lookup maps in sync', () => {
    expect(moduleIdToPath['qrcode-tool']).toBe('/qrcode');
    expect(pathToModuleId['/http-debug']).toBe('http-debug');
  });
});
