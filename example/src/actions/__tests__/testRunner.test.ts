import type { TestAction } from '../log';
import { TestLog } from '../testLog';
import { runAction } from '../testRunner';

describe('runAction', () => {
  let now = 0;
  const log = () =>
    new TestLog({ load: () => [], save: () => undefined }, () => now);

  beforeEach(() => {
    now = 0;
  });

  it('logs success with the action attached', async () => {
    const l = log();
    const action: TestAction = {
      type: 'EVENT',
      title: 'track demo',
      code: 'track()',
      run: async () => {
        now += 40;
        return { state: 'ok', detail: 'sent' };
      },
    };
    const outcome = await runAction(l, action, () => now);
    expect(outcome.elapsedMs).toBe(40);
    expect(outcome.entry.detail).toBe('sent · 40 ms');
    expect(outcome.entry.action).toBe(action);
    expect(l.entries()[0]?.state).toBe('ok');
  });

  it('turns thrown errors into error entries', async () => {
    const l = log();
    const outcome = await runAction(
      l,
      {
        type: 'INSPECT',
        title: 'linkDetails',
        code: 'linkDetails()',
        run: async () => {
          throw new Error('404 not found');
        },
      },
      () => now
    );
    expect(outcome.result.state).toBe('error');
    expect(outcome.entry.detail).toBe('404 not found');
    expect(outcome.entry.code).toContain('linkDetails()');
    expect(outcome.entry.code).toContain('404 not found');
  });

  it('includes the error code in the detail', async () => {
    const outcome = await runAction(
      log(),
      {
        type: 'EVENT',
        title: 'track',
        code: 'track()',
        run: () =>
          Promise.reject(
            Object.assign(new Error('SDK is disabled'), {
              code: 'SDK_DISABLED',
            })
          ),
      },
      () => now
    );
    expect(outcome.entry.state).toBe('error');
    expect(outcome.entry.detail).toContain('SDK_DISABLED');
  });

  it('never rejects, even for non-error throws', async () => {
    const outcome = await runAction(log(), {
      type: 'EVENT',
      title: 't',
      code: 'c',
      run: () => Promise.reject('boom'),
    });
    expect(outcome.entry.detail).toBe('boom');
  });

  it('running again adds another entry for the same action', async () => {
    const l = log();
    const action: TestAction = {
      type: 'EVENT',
      title: 'track',
      code: 'track()',
      run: async () => ({ state: 'ok', detail: 'sent' }),
    };
    await runAction(l, action);
    await runAction(l, l.entries()[0]!.action!);
    expect(l.entries()).toHaveLength(2);
    expect(l.entries()[0]?.action).toBe(l.entries()[1]?.action);
  });

  it('result code replaces action code', async () => {
    const outcome = await runAction(log(), {
      type: 'CREATE',
      title: 'generate',
      code: 'generateLink()',
      run: async () => ({
        state: 'ok',
        detail: 'ok',
        value: 'L',
        code: 'generateLink()\n\n-> "L"',
      }),
    });
    expect(outcome.entry.code).toBe('generateLink()\n\n-> "L"');
  });
});
