import { describe, expect, it } from 'vitest';
import { createNavigation, moduleIdToPath, pathToModuleId } from './constants';

describe('router/constants', () => {
  it('creates stable module navigation paths', () => {
    expect(createNavigation.encoder('base64')).toBe('/encoder/base64');
    expect(createNavigation.crypto('hash')).toBe('/crypto/hash');
    expect(createNavigation.time('timestamp')).toBe('/time/timestamp');
    expect(createNavigation.formatter('http')).toBe('/formatter/http');
    expect(createNavigation.regex('replace')).toBe('/regex/replace');
    expect(createNavigation.qrcode('scan')).toBe('/qrcode/scan');
    expect(createNavigation.diff()).toBe('/diff');
    expect(createNavigation.httpDebug()).toBe('/http-debug');
    expect(createNavigation.ipNetwork()).toBe('/ip-network');
    expect(createNavigation.recipe()).toBe('/recipe');
  });

  it('creates top-level module routes when no subtype is provided', () => {
    expect(createNavigation.encoder()).toBe('/encoder');
    expect(createNavigation.crypto()).toBe('/crypto');
    expect(createNavigation.time()).toBe('/time');
    expect(createNavigation.formatter()).toBe('/formatter');
    expect(createNavigation.regex()).toBe('/regex');
    expect(createNavigation.qrcode()).toBe('/qrcode');
  });

  it('keeps id-path lookup maps in sync', () => {
    expect(moduleIdToPath['encoder-decoder']).toBe('/encoder');
    expect(moduleIdToPath['time-tool']).toBe('/time');
    expect(moduleIdToPath['qrcode-tool']).toBe('/qrcode');
    expect(moduleIdToPath['recipe-tool']).toBe('/recipe');
    expect(pathToModuleId['/crypto']).toBe('crypto-tool');
    expect(pathToModuleId['/http-debug']).toBe('http-debug');
    expect(pathToModuleId['/ip-network']).toBe('ip-network');
  });
});
