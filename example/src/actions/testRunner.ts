import type { ActionResult, LogEntry, TestAction } from './log';
import type { TestLog } from './testLog';

export type RunOutcome = {
  result: ActionResult;
  entry: LogEntry;
  elapsedMs: number;
};

function failure(action: TestAction, error: unknown): ActionResult {
  const message =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const code = (error as { code?: unknown } | null)?.code;
  return {
    state: 'error',
    detail: typeof code === 'string' ? `${code}: ${message}` : message,
    code: `${action.code}\n\n${String(error)}`,
  };
}

/** Runs the action and logs it. Never rejects: a thrown error becomes an error entry. */
export async function runAction(
  log: TestLog,
  action: TestAction,
  clock: () => number = Date.now
): Promise<RunOutcome> {
  const start = clock();
  let result: ActionResult;
  try {
    result = await action.run();
  } catch (error) {
    result = failure(action, error);
  }
  const elapsedMs = clock() - start;
  const detail =
    result.state === 'error'
      ? result.detail
      : `${result.detail} · ${elapsedMs} ms`;
  const entry = log.add(
    action.type,
    result.state,
    action.title,
    detail,
    result.code ?? action.code,
    action
  );
  return { result, entry, elapsedMs };
}
