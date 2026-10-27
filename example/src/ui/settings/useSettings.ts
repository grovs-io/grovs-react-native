import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Grovs, { type LogLevel } from 'react-native-grovs-wrapper';
import { callCode } from '../../actions/callCode';
import { appLog } from '../../actions/testLog';
import { runAction } from '../../actions/testRunner';
import {
  apiKeyError,
  baseUrlError,
  profileNameError,
  restartChanges,
  type Profile,
} from '../../data/profile';
import { exampleStore } from '../../store/exampleStore';
import { settingsStore } from '../../store/settingsStore';

const RESTART_NOTICE_MS = 1500;

export type ProfileErrors = {
  name: string | null;
  apiKey: string | null;
  baseUrl: string | null;
};

const profileErrors = (p: Profile): ProfileErrors => ({
  name: profileNameError(p.name),
  apiKey: apiKeyError(p.apiKey),
  baseUrl: baseUrlError(p.baseUrl ?? ''),
});

const firstError = (errors: ProfileErrors) =>
  errors.name ?? errors.apiKey ?? errors.baseUrl;

function debugLevelAction(level: LogLevel) {
  return {
    type: 'SDK' as const,
    title: `Debug level ${level}`,
    code: callCode('setDebug', [['level', level]]),
    repeatable: false,
    run: async () => {
      Grovs.setDebug(level);
      return { state: 'ok' as const, detail: 'applied' };
    },
  };
}

/**
 * Project profiles and developer options. Profile edits go to a working copy
 * that is saved whenever it is valid; they apply after a restart.
 */
export function useSettings() {
  const [profiles, setProfiles] = useState(() => settingsStore.profiles);
  const [activeId, setActiveId] = useState(() => {
    const id = settingsStore.activeProfileId;
    return profiles.some((p) => p.id === id) ? id : profiles[0]!.id;
  });
  const saved = profiles.find((p) => p.id === activeId) ?? profiles[0]!;
  const [draft, setDraft] = useState(saved);
  const [debugLevel, setDebugState] = useState(() => settingsStore.debugLevel);
  const [restartNotice, setRestartNotice] = useState<string | null>(null);
  const restartTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(restartTimer.current), []);

  const profile = draft.id === activeId ? draft : saved;
  const errors = profileErrors(profile);
  const blockedBy = firstError(errors);
  const started = exampleStore.startedProfile;
  const changes = started ? restartChanges(started, profile) : [];

  const saveProfiles = (next: Profile[], id: string) => {
    setProfiles(next);
    setActiveId(id);
    settingsStore.profiles = next;
    settingsStore.activeProfileId = id;
  };

  const select = (id: string) => {
    const next = profiles.find((p) => p.id === id);
    if (!next) return;
    setDraft(next);
    saveProfiles(profiles, id);
  };

  const update = (change: Partial<Profile>) => {
    const next = { ...profile, ...change };
    if (next.baseUrl?.trim() === '') next.baseUrl = null;
    setDraft(next);
    if (firstError(profileErrors(next)) === null) {
      saveProfiles(
        profiles.map((p) => (p.id === next.id ? next : p)),
        next.id
      );
    }
  };

  const addProfile = () => {
    const copy = {
      ...saved,
      id: `profile-${Date.now()}`,
      name: `${saved.name} copy`,
    };
    setDraft(copy);
    saveProfiles([...profiles, copy], copy.id);
  };

  const deleteActive = () => {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter((p) => p.id !== activeId);
    setDraft(remaining[0]!);
    saveProfiles(remaining, remaining[0]!.id);
  };

  const restartNow = () => {
    if (blockedBy !== null || restartNotice !== null) return;
    settingsStore.profiles = profiles;
    settingsStore.activeProfileId = activeId;
    if (Platform.OS === 'android') {
      exampleStore.restart();
      return;
    }
    setRestartNotice('Close and reopen the app');
    restartTimer.current = setTimeout(
      () => exampleStore.restart(),
      RESTART_NOTICE_MS
    );
  };

  const setDebugLevel = (level: LogLevel) => {
    setDebugState(level);
    settingsStore.debugLevel = level;
    runAction(appLog, debugLevelAction(level));
  };

  return {
    profiles,
    profile,
    errors,
    update,
    select,
    addProfile,
    deleteActive,
    restart: changes.length > 0 ? { changes, blockedBy } : null,
    restartNow,
    restartNotice,
    debugLevel,
    setDebugLevel,
  };
}
