import { describe, expect, it } from 'vitest';
import { Base64DecodeOperation, Base64EncodeOperation } from './base64';
import { URLEncodeOperation } from './url';

describe('Encoding operations', () => {
  describe('URLEncodeOperation', () => {
    it('encodes form data using application/x-www-form-urlencoded rules', async () => {
      const operation = new URLEncodeOperation();
      const result = await operation.execute(
        { data: 'name=Jack Ma&note=a+b &expr=1+1=2', dataType: 'text' },
        { component: 'form' }
      );

      expect(result.success).toBe(true);
      expect(result.output.data).toBe('name=Jack+Ma&note=a%2Bb+&expr=1%2B1%3D2');
    });
  });

  describe('Base64EncodeOperation', () => {
    it('supports UTF-16 round-trip when paired with Base64 decode', async () => {
      const encoder = new Base64EncodeOperation();
      const decoder = new Base64DecodeOperation();
      const source = 'Hello世界';

      const encoded = await encoder.execute(
        { data: source, dataType: 'text' },
        { charset: 'utf-16' }
      );
      expect(encoded.success).toBe(true);

      const decoded = await decoder.execute(
        { data: encoded.output.data, dataType: 'base64' },
        { charset: 'utf-16' }
      );
      expect(decoded.success).toBe(true);
      expect(decoded.output.data).toBe(source);
    });

    it('fails when encoding unsupported characters to ISO-8859-1', async () => {
      const encoder = new Base64EncodeOperation();
      const result = await encoder.execute(
        { data: '你好', dataType: 'text' },
        { charset: 'iso-8859-1' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('ISO-8859-1');
    });
  });
});
