import { beforeEach, describe, expect, it } from 'vitest';
import { operationRegistry } from '../registry';
import { registerAllOperations } from './index';

describe('registerAllOperations', () => {
  beforeEach(() => {
    operationRegistry.clear();
  });

  it('registers operations required by detector suggestions', () => {
    registerAllOperations();
    const ids = operationRegistry.getAll().map(operation => operation.id);

    expect(ids).toEqual(expect.arrayContaining([
      'base64_decode',
      'base64url_decode',
      'from_hex',
      'from_binary',
      'url_decode',
      'html_entity_decode',
      'unicode_unescape',
      'json_format',
      'timestamp_to_date',
      'jwt_decode',
      'uuid_info',
      'ip_info',
      'mac_info',
    ]));
    expect(ids.length).toBeGreaterThanOrEqual(40);
  });
});
