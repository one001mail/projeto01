import { describe, expect, it } from 'vitest';
import { REDACTED_PLACEHOLDER, redactPayload } from './redaction.js';

describe('redactPayload', () => {
  it('returns a deep clone when no paths are given', () => {
    const input = { a: 1, b: { c: 'x' } };
    const out = redactPayload(input, []);
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
    (out as { b: { c: string } }).b.c = 'mutated';
    expect(input.b.c).toBe('x');
  });

  it('redacts a top-level field by exact path', () => {
    const out = redactPayload({ email: 'a@b.com', name: 'Ana' }, ['email']);
    expect(out).toEqual({ email: REDACTED_PLACEHOLDER, name: 'Ana' });
  });

  it('redacts a nested field through dot-notation', () => {
    const out = redactPayload({ body: { email: 'x@y', message: 'hi', meta: { ok: true } } }, [
      'body.email',
      'body.message',
    ]);
    expect(out).toEqual({
      body: {
        email: REDACTED_PLACEHOLDER,
        message: REDACTED_PLACEHOLDER,
        meta: { ok: true },
      },
    });
  });

  it('silently ignores paths that do not exist', () => {
    const out = redactPayload({ a: 1 }, ['b.c.d', 'a.x']);
    expect(out).toEqual({ a: 1 });
  });

  it('supports wildcard at any depth (object children)', () => {
    const out = redactPayload(
      { items: { x: { token: 't1' }, y: { token: 't2' }, z: { other: 'ok' } } },
      ['items.*.token'],
    );
    expect(out).toEqual({
      items: {
        x: { token: REDACTED_PLACEHOLDER },
        y: { token: REDACTED_PLACEHOLDER },
        z: { other: 'ok' },
      },
    });
  });

  it('supports wildcard inside arrays', () => {
    const out = redactPayload({ list: [{ s: 'a' }, { s: 'b' }] }, ['list.*.s']);
    expect(out).toEqual({
      list: [{ s: REDACTED_PLACEHOLDER }, { s: REDACTED_PLACEHOLDER }],
    });
  });

  it('redacts an entire array element when path ends at the wildcard', () => {
    const out = redactPayload({ list: ['a', 'b'] }, ['list.*']);
    expect(out).toEqual({ list: [REDACTED_PLACEHOLDER, REDACTED_PLACEHOLDER] });
  });

  it('handles null / non-object payloads safely', () => {
    expect(redactPayload(null, ['anything'])).toBeNull();
    expect(redactPayload(42, ['x'])).toBe(42);
    expect(redactPayload('str', ['x'])).toBe('str');
    expect(redactPayload(undefined, ['x'])).toBeUndefined();
  });
});
