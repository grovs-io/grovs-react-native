import {
  detectType,
  rowsFromJson,
  rowsToJson,
  toAliasMap,
  toValueMap,
  type KeyValueRow,
} from '../keyValue';

const row = (
  key: string,
  value: string,
  type: KeyValueRow['type'] = detectType(value)
): KeyValueRow => ({ key, value, type });

describe('detectType', () => {
  it('detects numbers, bools and text', () => {
    expect(detectType('12')).toBe('number');
    expect(detectType('-4.5')).toBe('number');
    expect(detectType('true')).toBe('bool');
    expect(detectType('FALSE')).toBe('bool');
    expect(detectType('2026-10-22')).toBe('text');
    expect(detectType('hello')).toBe('text');
    expect(detectType('')).toBe('text');
    expect(detectType('NaN')).toBe('text');
  });
});

describe('toValueMap', () => {
  it('converts by type, skips blank keys and trims keys', () => {
    expect(
      toValueMap([
        row(' level ', '3'),
        row('', 'x'),
        row('name', 'Ana'),
        row('on', 'True'),
        row('zip', '01234', 'text'),
        row('ratio', '4.5'),
      ])
    ).toEqual({ level: 3, name: 'Ana', on: true, zip: '01234', ratio: 4.5 });
  });

  it('keeps text when a number does not parse', () => {
    expect(toValueMap([row('a', 'abc', 'number')])).toEqual({ a: 'abc' });
    expect(toValueMap([row('a', 'Infinity', 'number')])).toEqual({
      a: 'Infinity',
    });
  });
});

describe('rowsFromJson', () => {
  it('detects types from JSON values', () => {
    const rows = rowsFromJson('{"a":"1","b":1,"c":true}');
    expect(rows.map((r) => r.type)).toEqual(['text', 'number', 'bool']);
    expect(rows).toEqual([
      { key: 'a', value: '1', type: 'text' },
      { key: 'b', value: '1', type: 'number' },
      { key: 'c', value: 'true', type: 'bool' },
    ]);
  });

  it('keeps quoted strings as text', () => {
    expect(toValueMap(rowsFromJson('{"zip":"01234","flag":"true"}'))).toEqual({
      zip: '01234',
      flag: 'true',
    });
  });

  it('throws on invalid JSON', () => {
    expect(() => rowsFromJson('{not json')).toThrow();
    expect(() => rowsFromJson('[1,2]')).toThrow();
  });
});

describe('rowsToJson', () => {
  it('writes typed values and round trips', () => {
    const json = rowsToJson([row('level', '3'), row('on', 'false')]);
    expect(JSON.parse(json)).toEqual({ level: 3, on: false });
    expect(rowsFromJson(json)).toEqual([
      { key: 'level', value: '3', type: 'number' },
      { key: 'on', value: 'false', type: 'bool' },
    ]);
  });
});

describe('toAliasMap', () => {
  it('keeps values as text and skips blank keys', () => {
    expect(
      toAliasMap([row(' Checkout ', '12'), row('', 'x'), row('Home', 'Main')])
    ).toEqual({ Checkout: '12', Home: 'Main' });
  });
});
