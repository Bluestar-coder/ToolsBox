import { describe, expect, it } from 'vitest';
import { createContextOperations } from './context-operations';

describe('context operations', () => {
  it('registers detector-suggested context operations', () => {
    const operations = createContextOperations();
    const ids = operations.map(operation => operation.id);

    expect(ids).toContain('timestamp_to_date');
    expect(ids).toContain('jwt_decode');
    expect(ids).toContain('uuid_info');
    expect(ids).toContain('ip_info');
    expect(ids).toContain('mac_info');
  });

  it('converts unix timestamp to readable date info', async () => {
    const operation = createContextOperations().find(item => item.id === 'timestamp_to_date');
    expect(operation).toBeDefined();

    const result = await operation!.execute(
      { data: '1700000000', dataType: 'number' },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.output.data).toContain('Unix秒');
    expect(result.output.data).toContain('ISO 8601');
  });

  it('decodes jwt into structured json', async () => {
    const operation = createContextOperations().find(item => item.id === 'jwt_decode');
    expect(operation).toBeDefined();

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZW1vIiwic3ViIjoiMTIzIn0.sig';
    const result = await operation!.execute(
      { data: token, dataType: 'jwt' },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.output.data).toContain('"header"');
    expect(result.output.data).toContain('"payload"');
  });

  it('parses ip and mac information', async () => {
    const operations = createContextOperations();
    const ipOperation = operations.find(item => item.id === 'ip_info');
    const macOperation = operations.find(item => item.id === 'mac_info');

    expect(ipOperation).toBeDefined();
    expect(macOperation).toBeDefined();

    const ipResult = await ipOperation!.execute(
      { data: '192.168.1.1', dataType: 'ip' },
      {}
    );
    expect(ipResult.success).toBe(true);
    expect(ipResult.output.data).toContain('"family": "IPv4"');
    expect(ipResult.output.data).toContain('"classification": "private"');

    const macResult = await macOperation!.execute(
      { data: '02:00:00:00:00:01', dataType: 'mac' },
      {}
    );
    expect(macResult.success).toBe(true);
    expect(macResult.output.data).toContain('"type": "unicast"');
    expect(macResult.output.data).toContain('"administration": "locally-administered"');
  });
});
