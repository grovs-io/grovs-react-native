const pad = (n: number) => String(n).padStart(2, '0');

export function middleEllipsis(text: string, keep = 5): string {
  return text.length <= keep * 2 + 1
    ? text
    : `${text.slice(0, keep)}…${text.slice(text.length - keep)}`;
}

export function formatClock(ms: number, seconds = false): string {
  const date = new Date(ms);
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return seconds ? `${clock}:${pad(date.getSeconds())}` : clock;
}

export function relativeTime(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'just now';
  if (hours < 1) return `${minutes} min ago`;
  if (days < 1) return `${hours} h ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
