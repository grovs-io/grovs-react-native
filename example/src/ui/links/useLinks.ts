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
import { useNav } from '../nav';

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

/** The link form, kept in the settings store when a link is generated. */
export function useLinks() {
  const { openLogs } = useNav();
  const [form, setForm] = useState(() => settingsStore.linkForm);
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
    const outcome = await runAction(appLog, action);
    const ok = outcome.result.state !== 'error';
    setResult({
      ok,
      time: outcome.entry.time,
      elapsedMs: outcome.elapsedMs,
      link: ok ? outcome.result.value : undefined,
      message: outcome.result.detail,
    });
    setRunning(false);
  };

  const formError = linkFormError(form);

  const generate = () => {
    if (formError !== null || running) return;
    settingsStore.linkForm = form;
    run(buildGenerateLink(form));
  };

  const runAgain = () => {
    if (lastAction.current && !running) run(lastAction.current);
  };

  const inspect = async (input = latestInput.current) => {
    if (input.trim() === '') return;
    openLogs(await inspectLink(input));
  };

  const inspectGenerated = (link: string) => {
    setInspectInput(link);
    inspect(link);
  };

  const reset = () => {
    setForm(DEFAULT_LINK_FORM);
    setFormKey((key) => key + 1);
    settingsStore.linkForm = DEFAULT_LINK_FORM;
  };

  return {
    form,
    formKey,
    update: (change: Partial<LinkForm>) =>
      setForm((current) => ({ ...current, ...change })),
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
