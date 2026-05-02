import { describe, expect, it } from 'vitest';
import {
  PUBLIC_CODE_ALPHABET,
  PUBLIC_CODE_LENGTH,
  generatePublicCode,
  isValidPublicCode,
} from './public-code.js';

describe('public-code', () => {
  it('generates codes of the expected length and alphabet', () => {
    let i = 0;
    const code = generatePublicCode(() => {
      const v = i % PUBLIC_CODE_ALPHABET.length;
      i += 1;
      return v;
    });
    expect(code).toHaveLength(PUBLIC_CODE_LENGTH);
    for (const ch of code) {
      expect(PUBLIC_CODE_ALPHABET.includes(ch)).toBe(true);
    }
  });

  it('rejects malformed codes', () => {
    expect(isValidPublicCode('')).toBe(false);
    expect(isValidPublicCode('toolong1234567890')).toBe(false);
    expect(isValidPublicCode('A'.repeat(PUBLIC_CODE_LENGTH))).toBe(true);
    // lowercase is not in the alphabet
    expect(isValidPublicCode('a'.repeat(PUBLIC_CODE_LENGTH))).toBe(false);
    // zero is excluded to avoid 0/O confusion
    expect(isValidPublicCode('0'.repeat(PUBLIC_CODE_LENGTH))).toBe(false);
  });

  it('throws when the random source returns an out-of-range value', () => {
    expect(() => generatePublicCode(() => 999)).toThrowError(/out-of-range/);
  });
});
