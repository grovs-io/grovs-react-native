import { currencySymbol, formatCents, parseAmountToCents } from '../money';

describe('parseAmountToCents', () => {
  it('parses amounts', () => {
    expect(parseAmountToCents('4.99')).toBe(499);
    expect(parseAmountToCents('4,99')).toBe(499);
    expect(parseAmountToCents('5')).toBe(500);
    expect(parseAmountToCents('0.1')).toBe(10);
  });

  it('rejects bad input', () => {
    expect(parseAmountToCents('4.999')).toBeNull();
    expect(parseAmountToCents('')).toBeNull();
    expect(parseAmountToCents('-1')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('99999999999')).toBeNull();
  });
});

describe('formatCents and currencySymbol', () => {
  it('formats cents', () => {
    expect(formatCents(499)).toBe('4.99');
    expect(formatCents(5)).toBe('0.05');
  });

  it('finds the symbol or falls back to the code', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('XYZ1')).toBe('XYZ1');
  });

  it('knows common symbols when Intl only gives the code, as Hermes on iOS does', () => {
    const spy = jest.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
      throw new Error('no Intl');
    });
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
    expect(currencySymbol('GBP')).toBe('£');
    expect(currencySymbol('RON')).toBe('RON');
    spy.mockRestore();
  });
});
