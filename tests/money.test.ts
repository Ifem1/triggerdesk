import { checkedMultiply, formatKelvin, parseRloToKelvin, U64_MAX } from '../lib/rialo/money';

describe('exact RLO/Kelvin arithmetic', () => {
  test.each([
    ['1', 1_000_000_000n],
    ['0.000000001', 1n],
    ['1.23456789', 1_234_567_890n],
    ['18446744073.709551615', U64_MAX],
  ])('parses %s exactly', (input, expected) => {
    expect(parseRloToKelvin(input)).toBe(expected);
  });

  test.each(['0', '-1', '1e3', '1.0000000001', '01', 'NaN', ''])('rejects unsafe input %s', (input) => {
    expect(() => parseRloToKelvin(input)).toThrow();
  });

  test('rejects u64 overflow', () => {
    expect(() => parseRloToKelvin('18446744073.709551616')).toThrow(/u64/);
    expect(() => checkedMultiply(U64_MAX, 2n)).toThrow(/u64/);
  });

  test('formats without floating-point conversion', () => {
    expect(formatKelvin(1n)).toBe('0.000000001');
    expect(formatKelvin(U64_MAX)).toBe('18446744073.709551615');
  });
});
