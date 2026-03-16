import { toOptionalBoolean } from './query-transformers';

describe('toOptionalBoolean', () => {
  test('returns booleans for boolean-like string values', () => {
    expect(toOptionalBoolean('true')).toBe(true);
    expect(toOptionalBoolean('false')).toBe(false);
    expect(toOptionalBoolean('  TRUE  ')).toBe(true);
  });

  test('supports 1 and 0 query values', () => {
    expect(toOptionalBoolean('1')).toBe(true);
    expect(toOptionalBoolean('0')).toBe(false);
  });

  test('returns undefined for missing or unsupported values', () => {
    expect(toOptionalBoolean(undefined)).toBeUndefined();
    expect(toOptionalBoolean(null)).toBeUndefined();
    expect(toOptionalBoolean('')).toBeUndefined();
    expect(toOptionalBoolean('yes')).toBeUndefined();
  });
});
