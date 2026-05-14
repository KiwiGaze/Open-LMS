import { describe, expect, it } from 'vitest';
import { readServerPort } from '../src/server.ts';

describe('server configuration', () => {
  it('uses port 3000 by default', () => {
    expect(readServerPort({})).toBe(3000);
  });

  it('uses PORT when it is a valid integer', () => {
    expect(readServerPort({ PORT: '4317' })).toBe(4317);
  });

  it('rejects invalid PORT values', () => {
    expect(() => readServerPort({ PORT: 'not-a-port' })).toThrow(
      'PORT must be a positive integer.',
    );
  });

  it('rejects partially numeric PORT values', () => {
    expect(() => readServerPort({ PORT: '3000abc' })).toThrow('PORT must be a positive integer.');
    expect(() => readServerPort({ PORT: '3000.5' })).toThrow('PORT must be a positive integer.');
  });

  it('rejects out-of-range PORT values', () => {
    expect(() => readServerPort({ PORT: '65536' })).toThrow('PORT must be between 1 and 65535.');
  });
});
