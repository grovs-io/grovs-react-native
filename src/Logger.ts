import type { LogLevel } from './NativeGrovsWrapper';

function createLogger(libraryName: string) {
  function getCallerInfo() {
    const stack = new Error().stack?.split('\n') || [];
    // The stack frame we want is usually the 4th line (index 3)
    const callerLine = stack[3] || '';
    // Example: "    at invoke (EventsManager.ts:169:13)"
    const match =
      callerLine.match(/at\s+(.*)\s+\((.*):(\d+):\d+\)/) ||
      callerLine.match(/at\s+(.*):(\d+):\d+/);

    if (match) {
      if (match.length === 4) {
        const method = match[1] || '<anonymous>';
        const lineNumber = match[3] || '?';
        return { method, lineNumber };
      } else if (match.length === 3) {
        const lineNumber = match[2] || '?';

        return { method: '<anonymous>', lineNumber };
      }
    }
    return { method: '<unknown>', lineNumber: '?' };
  }

  return (level: LogLevel, ...message: unknown[]) => {
    const { method, lineNumber } = getCallerInfo();
    const prefix = `🔗${libraryName} [${level}] -> ${method} [Line ${lineNumber}]:`;
    switch (level) {
      case 'info':
        console.log(prefix, ...message);
        break;
      case 'error':
        console.error(prefix, ...message);
        break;
    }
  };
}

export const log = createLogger('GROVS JS');
