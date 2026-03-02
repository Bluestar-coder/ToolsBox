import { describe, expect, it } from 'vitest';
import { DataTypeDetector } from './detector';

describe('DataTypeDetector', () => {
  it('detects JWT tokens with base64url segments', () => {
    const detector = new DataTypeDetector();
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZW1vIiwic3ViIjoiMTIzIn0.sig';

    const results = detector.detectDataTypes(token);
    const jwtResult = results.find(result => result.type === 'jwt');

    expect(jwtResult).toBeDefined();
    expect(jwtResult?.confidence).toBeGreaterThan(0.5);
  });

  it('detects compressed and mixed IPv6 addresses', () => {
    const detector = new DataTypeDetector();
    const compressed = detector.detectDataTypes('2001:db8::1');
    const mapped = detector.detectDataTypes('::ffff:192.168.1.1');
    const mixed = detector.detectDataTypes('2001:db8::192.0.2.1');

    expect(compressed.some(result => result.type === 'ipv6')).toBe(true);
    expect(mapped.some(result => result.type === 'ipv6')).toBe(true);
    expect(mixed.some(result => result.type === 'ipv6')).toBe(true);
  });
});
