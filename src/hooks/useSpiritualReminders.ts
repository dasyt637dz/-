import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationPreferences } from '../types/recovery';

const SCHEDULED_SLOTS_KEY = 'somoud_salawat_slots_v1';
const NEXT_SALAWAT_NOTIF_KEY = 'somoud_salawat_next_notif_at';
const LAST_STEADFAST_CHECK_KEY = 'somoud_steadfast_last_check_at';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TARGET_HOURS = new Set([3, 5, 9, 15, 17, 21]);

const SALAWAT_MESSAGES = [
  'اللهم صلِّ وسلم وبارك على نبينا محمد ﷺ',
  'صلي على النبي ﷺ؛ من صلّى عليه صلاة صلّى الله عليه بها عشراً',
  'اذكر الله وصلِّ على الحبيب محمد ﷺ لتنل سكينة القلب وثبات النفس',
  'اللهم صلِّ على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم',
];

export type BrowserNotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

function getNotificationStatus(): BrowserNotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function randomSalawatDelayMs(): number {
  const minMinutes = 35;
  const maxMinutes = 55;
  const mins = minMinutes + Math.floor(Math.random() * (maxMinutes - minMinutes + 1));
  return mins * 60 * 1000;
}

function pickRandomSalawatMessage(): string {
  return SALAWAT_MESSAGES[Math.floor(Math.random() * SALAWAT_MESSAGES.length)];
}

async function sendSystemNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    tag,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

function hasSlotTriggered(slotKey: string, todayPrefix: string): boolean {
  try {
    const raw = localStorage.getItem(SCHEDULED_SLOTS_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return false;
    return list.some((item) => item === slotKey && typeof item === 'string' && item.startsWith(todayPrefix));
  } catch {
    return false;
  }
}

function markSlotTriggered(slotKey: string, todayPrefix: string): void {
  try {
    const raw = localStorage.getItem(SCHEDULED_SLOTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const todaySlots = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.startsWith(todayPrefix))
      : [];
    if (!todaySlots.includes(slotKey)) {
      todaySlots.push(slotKey);
    }
    localStorage.setItem(SCHEDULED_SLOTS_KEY, JSON.stringify(todaySlots));
  } catch {
    // Ignore storage quota errors
  }
}

interface UseSpiritualRemindersOptions {
  isAppReady: boolean;
  prefs: NotificationPreferences;
}

export function useSpiritualReminders({ isAppReady, prefs }: UseSpiritualRemindersOptions) {
  const [salawatVisible, setSalawatVisible] = useState(false);
  const [salawatCountdown, setSalawatCountdown] = useState(3);
  const [salawatRunId, setSalawatRunId] = useState(0);

  const [steadfastPromptVisible, setSteadfastPromptVisible] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<BrowserNotificationStatus>(
    getNotificationStatus
  );

  const hasTriggeredEntryRef = useRef(false);

  const triggerSalawatBannerNow = useCallback((withNotification = false) => {
    setSalawatCountdown(3);
    setSalawatVisible(true);
    setSalawatRunId((prev) => prev + 1);
    if (withNotification) {
      void sendSystemNotification(
        'صلي على النبي ﷺ',
        pickRandomSalawatMessage(),
        'somoud-salawat'
      );
    }
  }, []);

  const dismissSalawatBanner = useCallback(() => {
    setSalawatVisible(false);
  }, []);

  const triggerSteadfastCheckNow = useCallback((withNotification = true) => {
    try {
      localStorage.setItem(LAST_STEADFAST_CHECK_KEY, String(Date.now()));
    } catch {
      // Ignore storage errors
    }
    setSteadfastPromptVisible(true);
    if (withNotification) {
      void sendSystemNotification(
        'هل لا زلت صامداً؟',
        'تذكير كل ساعتين: جدّد عهدك بالثبات وصلِّ على النبي ﷺ.',
        'somoud-steadfast-check'
      );
    }
  }, []);

  const dismissSteadfastPrompt = useCallback(() => {
    try {
      localStorage.setItem(LAST_STEADFAST_CHECK_KEY, String(Date.now()));
    } catch {
      // Ignore storage errors
    }
    setSteadfastPromptVisible(false);
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<BrowserNotificationStatus> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionStatus('unsupported');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === 'granted') {
        void sendSystemNotification(
          'تم تفعيل تذكيرات صمود',
          'سيصلك تذكير بالصلاة على النبي ﷺ من حين لآخر، وسؤال «هل لا زلت صامداً؟» كل ساعتين.',
          'somoud-welcome-notif'
        );
      }
      return result;
    } catch {
      const current = getNotificationStatus();
      setPermissionStatus(current);
      return current;
    }
  }, []);

  // 3-second countdown lifecycle for Salawat banner
  useEffect(() => {
    if (!salawatVisible || salawatRunId === 0) return;

    const t1 = window.setTimeout(() => setSalawatCountdown(2), 1000);
    const t2 = window.setTimeout(() => setSalawatCountdown(1), 2000);
    const t3 = window.setTimeout(() => setSalawatVisible(false), 3000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [salawatVisible, salawatRunId]);

  // Show banner upon entering the app (right after SplashScreen completes)
  useEffect(() => {
    if (!isAppReady || hasTriggeredEntryRef.current) return;
    hasTriggeredEntryRef.current = true;
    if (prefs.salawatBannerEnabled) {
      triggerSalawatBannerNow(false);
    }
  }, [isAppReady, prefs.salawatBannerEnabled, triggerSalawatBannerNow]);

  // Initialize periodic timestamps on first run
  useEffect(() => {
    try {
      if (!localStorage.getItem(NEXT_SALAWAT_NOTIF_KEY)) {
        localStorage.setItem(
          NEXT_SALAWAT_NOTIF_KEY,
          String(Date.now() + randomSalawatDelayMs())
        );
      }
      if (!localStorage.getItem(LAST_STEADFAST_CHECK_KEY)) {
        localStorage.setItem(LAST_STEADFAST_CHECK_KEY, String(Date.now()));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Evaluate scheduled hours (9:00, 5:00, 3:00), occasional Salawat, and 2-hour Steadfast check
  const evaluateSchedules = useCallback(() => {
    if (!isAppReady) return;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const todayPrefix = getLocalDateKey(now);

    // 1. Scheduled exact hours: 9:00, 5:00, 3:00 (AM & PM: 03, 05, 09, 15, 17, 21)
    if (TARGET_HOURS.has(hour) && minute === 0) {
      const slotKey = `${todayPrefix}-${String(hour).padStart(2, '0')}`;
      if (!hasSlotTriggered(slotKey, todayPrefix)) {
        markSlotTriggered(slotKey, todayPrefix);
        if (prefs.salawatBannerEnabled) {
          triggerSalawatBannerNow(prefs.salawatPeriodicNotifications);
        } else if (prefs.salawatPeriodicNotifications) {
          void sendSystemNotification(
            'صلي على النبي ﷺ',
            pickRandomSalawatMessage(),
            `somoud-salawat-${hour}`
          );
        }
      }
    }

    // 2. Occasional Salawat notifications ("من حين لآخر")
    if (prefs.salawatPeriodicNotifications) {
      try {
        const nextRaw = localStorage.getItem(NEXT_SALAWAT_NOTIF_KEY);
        const nextAt = nextRaw ? Number(nextRaw) : 0;
        if (nextAt > 0 && Date.now() >= nextAt) {
          localStorage.setItem(
            NEXT_SALAWAT_NOTIF_KEY,
            String(Date.now() + randomSalawatDelayMs())
          );
          if (document.visibilityState === 'visible' && prefs.salawatBannerEnabled) {
            triggerSalawatBannerNow(true);
          } else {
            void sendSystemNotification(
              'صلي على النبي ﷺ',
              pickRandomSalawatMessage(),
              'somoud-salawat-periodic'
            );
          }
        }
      } catch {
        // Ignore storage errors
      }
    }

    // 3. Every 2 hours: "هل لا زلت صامداً؟"
    if (prefs.steadfastCheckEveryTwoHours) {
      try {
        const lastRaw = localStorage.getItem(LAST_STEADFAST_CHECK_KEY);
        const lastAt = lastRaw ? Number(lastRaw) : Date.now();
        if (Date.now() - lastAt >= TWO_HOURS_MS) {
          triggerSteadfastCheckNow(true);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [
    isAppReady,
    prefs.salawatBannerEnabled,
    prefs.salawatPeriodicNotifications,
    prefs.steadfastCheckEveryTwoHours,
    triggerSalawatBannerNow,
    triggerSteadfastCheckNow,
  ]);

  useEffect(() => {
    if (!isAppReady) return;
    evaluateSchedules();

    const intervalId = window.setInterval(evaluateSchedules, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setPermissionStatus(getNotificationStatus());
        evaluateSchedules();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAppReady, evaluateSchedules]);

  return {
    salawatVisible,
    salawatCountdown,
    salawatRunId,
    steadfastPromptVisible,
    permissionStatus,
    requestNotificationPermission,
    triggerSalawatBannerNow,
    dismissSalawatBanner,
    triggerSteadfastCheckNow,
    dismissSteadfastPrompt,
  };
}
