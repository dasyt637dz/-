import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_HABITS, DEFAULT_PERSONAL_REASONS } from '../data/recoveryContent';
import {
  DailyCheckIn,
  JournalEntry,
  LogEntryType,
  NotificationPreferences,
  OnboardingProfile,
  RecoveryState,
  ThemeMode,
  TimeOfDay,
  WeaknessId,
} from '../types/recovery';

const STORAGE_KEY = 'safaa_recovery_v1';

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStreakMetrics(streakStartedAt: string, nowMs: number = Date.now()) {
  const startDate = new Date(streakStartedAt);

  if (Number.isNaN(startDate.getTime()) || nowMs <= startDate.getTime()) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      elapsedSeconds: 0,
      totalHours: 0,
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startDate.getTime()) / 1000));
  const totalHours = Math.floor(elapsedSeconds / 3600);
  const days = Math.floor(elapsedSeconds / 86400);
  const hours = Math.floor((elapsedSeconds % 86400) / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    elapsedSeconds,
    totalHours,
  };
}

function getInitialTheme(): ThemeMode {
  return 'light';
}

const DEFAULT_ONBOARDING: OnboardingProfile = {
  completed: false,
  age: null,
  discoveryMethod: '',
  discoveryCustom: '',
  intent: null,
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  salawatBannerEnabled: true,
  salawatPeriodicNotifications: true,
  steadfastCheckEveryTwoHours: true,
  promptDismissed: false,
};

function createDefaultState(): RecoveryState {
  return {
    streakStartedAt: new Date().toISOString(),
    bestStreakSeconds: 0,
    theme: getInitialTheme(),
    pinCode: null,
    onboarding: DEFAULT_ONBOARDING,
    selectedWeakness: null,
    weaknessCustomNote: '',
    appliedSolutionDates: [],
    personalReasons: DEFAULT_PERSONAL_REASONS,
    journal: [],
    checkIns: {},
    habits: DEFAULT_HABITS,
    completedSafeguards: [],
    previousStreaksDays: [],
    notifications: DEFAULT_NOTIFICATIONS,
  };
}

function loadStoredState(): RecoveryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<RecoveryState>;
    const defaults = createDefaultState();
    return {
      ...defaults,
      ...parsed,
      onboarding:
        parsed.onboarding && typeof parsed.onboarding === 'object'
          ? { ...DEFAULT_ONBOARDING, ...parsed.onboarding }
          : DEFAULT_ONBOARDING,
      appliedSolutionDates: Array.isArray(parsed.appliedSolutionDates)
        ? parsed.appliedSolutionDates
        : [],
      personalReasons: Array.isArray(parsed.personalReasons)
        ? parsed.personalReasons
        : defaults.personalReasons,
      journal: Array.isArray(parsed.journal) ? parsed.journal : [],
      checkIns: parsed.checkIns && typeof parsed.checkIns === 'object' ? parsed.checkIns : {},
      habits:
        Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : defaults.habits,
      completedSafeguards: Array.isArray(parsed.completedSafeguards)
        ? parsed.completedSafeguards
        : [],
      previousStreaksDays: Array.isArray(parsed.previousStreaksDays)
        ? parsed.previousStreaksDays
        : [],
      notifications:
        parsed.notifications && typeof parsed.notifications === 'object'
          ? { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications }
          : DEFAULT_NOTIFICATIONS,
    };
  } catch {
    return createDefaultState();
  }
}

export function useRecoveryStore() {
  const [state, setState] = useState<RecoveryState>(loadStoredState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const saveOnboarding = useCallback((profile: OnboardingProfile) => {
    setState((prev) => ({
      ...prev,
      onboarding: { ...profile, completed: true },
    }));
  }, []);

  const setWeakness = useCallback((weaknessId: WeaknessId | null) => {
    setState((prev) => ({
      ...prev,
      selectedWeakness: weaknessId,
    }));
  }, []);

  const setWeaknessCustomNote = useCallback((note: string) => {
    setState((prev) => ({
      ...prev,
      weaknessCustomNote: note,
    }));
  }, []);

  const markDailySolutionApplied = useCallback(() => {
    const todayKey = getLocalDateKey();
    setState((prev) => {
      if (prev.appliedSolutionDates.includes(todayKey)) return prev;
      return {
        ...prev,
        appliedSolutionDates: [todayKey, ...prev.appliedSolutionDates].slice(0, 90),
      };
    });
  }, []);

  const setStreakStartDate = useCallback((isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return;
    const safeDate = parsed.getTime() > Date.now() ? new Date() : parsed;
    setState((prev) => ({
      ...prev,
      streakStartedAt: safeDate.toISOString(),
    }));
  }, []);

  const resetStreakExplicit = useCallback(() => {
    const now = new Date();
    const todayKey = getLocalDateKey(now);

    setState((prev) => {
      const metrics = getStreakMetrics(prev.streakStartedAt, now.getTime());
      const updatedBest = Math.max(
        prev.bestStreakSeconds,
        metrics.days * 86400,
        metrics.elapsedSeconds
      );
      const completedDays = metrics.days;
      const existingToday = prev.checkIns[todayKey];

      const relapseEntry: JournalEntry = {
        id: `log_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now.toISOString(),
        type: 'relapse',
        triggers: ['إعادة ضبط من الرئيسية'],
        timeOfDay:
          now.getHours() < 12
            ? 'morning'
            : now.getHours() < 17
            ? 'afternoon'
            : now.getHours() < 22
            ? 'evening'
            : 'night',
        intensity: 4,
        notes: 'تمت إعادة العداد للبدء من جديد بوعي أكبر.',
      };

      return {
        ...prev,
        bestStreakSeconds: updatedBest,
        streakStartedAt: now.toISOString(),
        previousStreaksDays:
          completedDays > 0
            ? [completedDays, ...prev.previousStreaksDays].slice(0, 20)
            : prev.previousStreaksDays,
        journal: [relapseEntry, ...prev.journal],
        checkIns: {
          ...prev.checkIns,
          [todayKey]: {
            date: todayKey,
            mood: existingToday?.mood ?? 2,
            urgeLevel: existingToday?.urgeLevel ?? 4,
            note: existingToday?.note ?? '',
            completedHabitIds: existingToday?.completedHabitIds ?? [],
            status: 'relapse',
          },
        },
      };
    });
  }, []);

  const addJournalEntry = useCallback(
    (payload: {
      type: LogEntryType;
      triggers: string[];
      timeOfDay: TimeOfDay;
      intensity: number;
      notes: string;
      actionTaken?: string;
      resetStreak?: boolean;
    }) => {
      const now = new Date();
      const todayKey = getLocalDateKey(now);
      const entry: JournalEntry = {
        id: `log_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now.toISOString(),
        type: payload.type,
        triggers: payload.triggers,
        timeOfDay: payload.timeOfDay,
        intensity: payload.intensity,
        notes: payload.notes.trim(),
        actionTaken: payload.actionTaken?.trim(),
      };

      setState((prev) => {
        const metrics = getStreakMetrics(prev.streakStartedAt, now.getTime());
        const updatedBest = Math.max(
          prev.bestStreakSeconds,
          metrics.days * 86400,
          metrics.elapsedSeconds
        );
        const shouldReset = payload.type === 'relapse' && payload.resetStreak !== false;
        const completedDays = metrics.days;

        const existingToday = prev.checkIns[todayKey];
        const updatedCheckIns = { ...prev.checkIns };
        if (shouldReset) {
          updatedCheckIns[todayKey] = {
            date: todayKey,
            mood: existingToday?.mood ?? 2,
            urgeLevel: payload.intensity,
            note: existingToday?.note ?? '',
            completedHabitIds: existingToday?.completedHabitIds ?? [],
            status: 'relapse',
          };
        } else if (!existingToday) {
          updatedCheckIns[todayKey] = {
            date: todayKey,
            mood: 4,
            urgeLevel: payload.intensity,
            note: '',
            completedHabitIds: [],
            status: 'clean',
          };
        }

        return {
          ...prev,
          bestStreakSeconds: updatedBest,
          streakStartedAt: shouldReset ? now.toISOString() : prev.streakStartedAt,
          previousStreaksDays:
            shouldReset && completedDays > 0
              ? [completedDays, ...prev.previousStreaksDays].slice(0, 20)
              : prev.previousStreaksDays,
          journal: [entry, ...prev.journal],
          checkIns: updatedCheckIns,
        };
      });
    },
    []
  );

  const deleteJournalEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      journal: prev.journal.filter((item) => item.id !== id),
    }));
  }, []);

  const saveDailyCheckIn = useCallback(
    (payload: {
      mood: number;
      urgeLevel: number;
      note: string;
      tags?: string[];
      dateKey?: string;
    }) => {
      const key = payload.dateKey ?? getLocalDateKey();
      const nowIso = new Date().toISOString();
      setState((prev) => {
        const existing = prev.checkIns[key];
        const nextCheckIn: DailyCheckIn = {
          date: key,
          mood: payload.mood,
          urgeLevel: payload.urgeLevel,
          note: payload.note.trim(),
          tags: payload.tags ?? existing?.tags ?? [],
          checkedInAt: nowIso,
          completedHabitIds: existing?.completedHabitIds ?? [],
          status: existing?.status ?? 'clean',
        };
        return {
          ...prev,
          checkIns: {
            ...prev.checkIns,
            [key]: nextCheckIn,
          },
        };
      });
    },
    []
  );

  const toggleHabitToday = useCallback((habitId: string) => {
    const todayKey = getLocalDateKey();
    setState((prev) => {
      const existing = prev.checkIns[todayKey];
      const currentIds = existing?.completedHabitIds ?? [];
      const exists = currentIds.includes(habitId);
      const nextIds = exists
        ? currentIds.filter((id) => id !== habitId)
        : [...currentIds, habitId];

      return {
        ...prev,
        checkIns: {
          ...prev.checkIns,
          [todayKey]: {
            date: todayKey,
            mood: existing?.mood ?? 3,
            urgeLevel: existing?.urgeLevel ?? 2,
            note: existing?.note ?? '',
            completedHabitIds: nextIds,
            status: existing?.status ?? 'clean',
          },
        },
      };
    });
  }, []);

  const addCustomHabit = useCallback((title: string, category: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setState((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: `habit_${Date.now()}`,
          title: cleanTitle,
          category: category.trim() || 'عادة يومية',
        },
      ],
    }));
  }, []);

  const removeHabit = useCallback((habitId: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }));
  }, []);

  const toggleSafeguard = useCallback((safeguardId: string) => {
    setState((prev) => {
      const exists = prev.completedSafeguards.includes(safeguardId);
      return {
        ...prev,
        completedSafeguards: exists
          ? prev.completedSafeguards.filter((id) => id !== safeguardId)
          : [...prev.completedSafeguards, safeguardId],
      };
    });
  }, []);

  const addPersonalReason = useCallback((reason: string) => {
    const clean = reason.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      personalReasons: [clean, ...prev.personalReasons],
    }));
  }, []);

  const removePersonalReason = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      personalReasons: prev.personalReasons.filter((_, i) => i !== index),
    }));
  }, []);

  const setPinCode = useCallback((pin: string | null) => {
    setState((prev) => ({
      ...prev,
      pinCode: pin,
    }));
  }, []);

  const importState = useCallback((rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson) as Partial<RecoveryState>;
      if (!parsed || typeof parsed.streakStartedAt !== 'string') {
        return false;
      }
      const defaults = createDefaultState();
      setState({
        ...defaults,
        ...parsed,
        onboarding:
          parsed.onboarding && typeof parsed.onboarding === 'object'
            ? { ...DEFAULT_ONBOARDING, ...parsed.onboarding }
            : defaults.onboarding,
        appliedSolutionDates: Array.isArray(parsed.appliedSolutionDates)
          ? parsed.appliedSolutionDates
          : [],
        personalReasons: Array.isArray(parsed.personalReasons)
          ? parsed.personalReasons
          : defaults.personalReasons,
        journal: Array.isArray(parsed.journal) ? parsed.journal : [],
        checkIns: parsed.checkIns && typeof parsed.checkIns === 'object' ? parsed.checkIns : {},
        habits:
          Array.isArray(parsed.habits) && parsed.habits.length > 0
            ? parsed.habits
            : defaults.habits,
        completedSafeguards: Array.isArray(parsed.completedSafeguards)
          ? parsed.completedSafeguards
          : [],
        previousStreaksDays: Array.isArray(parsed.previousStreaksDays)
          ? parsed.previousStreaksDays
          : [],
        notifications:
          parsed.notifications && typeof parsed.notifications === 'object'
            ? { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications }
            : DEFAULT_NOTIFICATIONS,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearAllData = useCallback(() => {
    const fresh = createDefaultState();
    setState(fresh);
  }, []);

  const updateNotificationPrefs = useCallback(
    (partial: Partial<NotificationPreferences>) => {
      setState((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          ...partial,
        },
      }));
    },
    []
  );

  return {
    state,
    toggleTheme,
    setTheme,
    saveOnboarding,
    setWeakness,
    setWeaknessCustomNote,
    markDailySolutionApplied,
    setStreakStartDate,
    resetStreakExplicit,
    addJournalEntry,
    deleteJournalEntry,
    saveDailyCheckIn,
    toggleHabitToday,
    addCustomHabit,
    removeHabit,
    toggleSafeguard,
    addPersonalReason,
    removePersonalReason,
    setPinCode,
    updateNotificationPrefs,
    importState,
    clearAllData,
  };
}
