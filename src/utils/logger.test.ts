import { beforeEach, describe, expect, it, vi } from 'vitest';
import { debug, error, log, logger, warn } from './logger';

describe('logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('records log, warn, error and debug entries with formatted messages', () => {
    log('plain message', { id: 1 });
    warn({ code: 'WARN_OBJECT' });
    error('error message', new Error('boom'));
    debug('debug message');

    const logs = logger.getLogs();
    expect(logs).toHaveLength(4);
    expect(logs[0]).toMatchObject({
      level: 'log',
      message: 'plain message',
      data: [{ id: 1 }],
    });
    expect(logs[1]).toMatchObject({
      level: 'warn',
      message: JSON.stringify({ code: 'WARN_OBJECT' }),
    });
    expect(logs[2]).toMatchObject({
      level: 'error',
      message: 'error message',
    });
    expect(logs[3]).toMatchObject({
      level: 'debug',
      message: 'debug message',
    });

    expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'plain message', { id: 1 });
    expect(console.warn).toHaveBeenCalledWith('[WARN]', { code: 'WARN_OBJECT' });
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'error message', expect.any(Error));
    expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'debug message');
  });

  it('caps the in-memory log buffer at one hundred entries and supports slicing', () => {
    for (let index = 0; index < 105; index += 1) {
      logger.error(`entry-${index}`);
    }

    const logs = logger.getLogs();
    expect(logs).toHaveLength(100);
    expect(logs[0].message).toBe('entry-5');
    expect(logs.at(-1)?.message).toBe('entry-104');
    expect(logger.getLogs(3).map((entry) => entry.message)).toEqual([
      'entry-102',
      'entry-103',
      'entry-104',
    ]);
  });

  it('exports and clears stored logs', () => {
    logger.log('first');
    logger.error('second');

    const exported = JSON.parse(logger.exportLogs()) as Array<{ message: string; level: string }>;
    expect(exported).toEqual([
      expect.objectContaining({ level: 'log', message: 'first' }),
      expect.objectContaining({ level: 'error', message: 'second' }),
    ]);

    logger.clearLogs();
    expect(logger.getLogs()).toEqual([]);
  });
});
