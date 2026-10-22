import type { Any } from 'react-native-grovs-wrapper';

export type ValueType = 'text' | 'number' | 'bool';
export type KeyValueRow = { key: string; value: string; type: ValueType };

const NUMBER = /^-?\d+(\.\d+)?$/;

export function detectType(value: string): ValueType {
  const v = value.trim();
  if (v.toLowerCase() === 'true' || v.toLowerCase() === 'false') return 'bool';
  return NUMBER.test(v) ? 'number' : 'text';
}

function convert(row: KeyValueRow): Any {
  const v = row.value.trim();
  if (row.type === 'bool') return v.toLowerCase() === 'true';
  if (row.type === 'number') {
    const n = Number(v);
    return v !== '' && Number.isFinite(n) ? n : row.value;
  }
  return row.value;
}

export function toValueMap(rows: KeyValueRow[]): Record<string, Any> {
  const map: Record<string, Any> = {};
  rows
    .filter((row) => row.key.trim() !== '')
    .forEach((row) => {
      map[row.key.trim()] = convert(row);
    });
  return map;
}

export function rowsFromJson(json: string): KeyValueRow[] {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object');
  }
  return Object.entries(parsed).map(([key, value]) => ({
    key,
    value: value === null ? '' : String(value),
    type:
      typeof value === 'boolean'
        ? 'bool'
        : typeof value === 'number'
          ? 'number'
          : 'text',
  }));
}

export function rowsToJson(rows: KeyValueRow[]): string {
  return JSON.stringify(toValueMap(rows), null, 2);
}

/** Text-only rows as a string map, for screen aliases. */
export function toAliasMap(rows: KeyValueRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  rows
    .filter((row) => row.key.trim() !== '')
    .forEach((row) => {
      map[row.key.trim()] = row.value;
    });
  return map;
}

export const keysSummary = (rows: KeyValueRow[]): string =>
  rows
    .map((row) => row.key.trim())
    .filter((key) => key !== '')
    .join(', ');
