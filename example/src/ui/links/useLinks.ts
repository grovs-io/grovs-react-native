import { useRef, useState } from 'react';
import { buildGenerateLink, buildInspect } from '../../actions/linkActions';
import type { TestAction } from '../../actions/log';
import { appLog } from '../../actions/testLog';
import { runAction } from '../../actions/testRunner';
import {
  DEFAULT_LINK_FORM,
  linkFormError,
  type LinkForm,
} from '../../data/forms';
import { settingsStore } from '../../store/settingsStore';
import { showToast } from '../controls/Toast';
import { useNav } from '../nav';
import { useSavedForm } from '../useStore';

export type LinkResult = {
  ok: boolean;
  time: number;
  elapsedMs: number;
  link?: string;
  /** The link's detail when ok, the full error otherwise. */
  message: string;
};

/** Runs linkDetails for the input and returns the new log entry's id. */
export async function inspectLink(input: string): Promise<number> {
  const { entry } = await runAction(appLog, buildInspect(input));
  return entry.id;
}

/** The link form, saved on every change and shared with Home. */
export function useLinks() {
  const { openLogs } = useNav();
  const [form, saveForm] = useSavedForm('linkForm');
  const [formKey, setFormKey] = useState(0);
  const [inspectInput, setInspectState] = useState('');
  // Paste fills the field and runs Done in the same tick, before state updates.
  const latestInput = useRef('');
  const [result, setResult] = useState<LinkResult | null>(null);
  const [running, setRunning] = useState(false);
  const lastAction = useRef<TestAction | null>(null);

  const setInspectInput = (text: string) => {
    latestInput.current = text;
    setInspectState(text);
  };

  const run = async (action: TestAction) => {
    lastAction.current = action;
    setRunning(true);
    try {
      const outcome = await runAction(appLog, action);
      const ok = outcome.result.state !== 'error';
      setResult({
        ok,
        time: outcome.entry.time,
        elapsedMs: outcome.elapsedMs,
        link: ok ? outcome.result.value : undefined,
        message: outcome.result.detail,
      });
    } finally {
      setRunning(false);
    }
  };

  const formError = linkFormError(form);

  const generate = () => {
    if (formError !== null || running) return;
    run(buildGenerateLink(form));
  };

  const runAgain = () => {
    if (lastAction.current && !running) run(lastAction.current);
  };

  const inspect = (input = latestInput.current) => {
    if (input.trim() === '') return;
    inspectLink(input)
      .then(openLogs)
      .catch(() => showToast('Could not inspect the link'));
  };

  const inspectGenerated = (link: string) => {
    setInspectInput(link);
    inspect(link);
  };

  const reset = () => {
    saveForm(DEFAULT_LINK_FORM);
    setFormKey((key) => key + 1);
  };

  return {
    form,
    formKey,
    // Reads the store, so two changes in one tick both land.
    update: (change: Partial<LinkForm>) =>
      saveForm({ ...settingsStore.linkForm, ...change }),
    formError,
    inspectInput,
    setInspectInput,
    inspect: () => inspect(),
    inspectGenerated,
    result,
    running,
    generate,
    runAgain,
    reset,
  };
}
