/** Writes an SDK call the way it would look in code, for the log detail view. */
export function callCode(name: string, args: Array<[string, unknown]>): string {
  if (args.length === 0) {
    return `${name}()`;
  }
  const lines = args.map(([key, value]) => `  ${key} = ${render(value, 1)}`);
  return `${name}(\n${lines.join(',\n')}\n)`;
}

export function render(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) {
    return `[${value.map((item) => render(item, depth)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const pad = '  '.repeat(depth + 1);
    const body = entries
      .map(([key, item]) => `${pad}${key}: ${render(item, depth + 1)}`)
      .join(',\n');
    return `{\n${body}\n${'  '.repeat(depth)}}`;
  }
  return String(value);
}
