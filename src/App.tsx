import { Analytics } from '@vercel/analytics/react';
import { Bell, Lock, Moon, Sun, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { HabitsShieldView } from './components/HabitsShieldView';
import { JournalView } from './components/JournalView';
import { MobileNav } from './components/MobileNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PinLockScreen } from './components/PinLockScreen';
import { PrivacySettingsView } from './components/PrivacySettingsView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SalawatBanner } from './components/SalawatBanner';
import { SplashScreen } from './components/SplashScreen';
import { SteadfastCheckBanner } from './components/SteadfastCheckBanner';
import { TopBar } from './components/TopBar';
import { UrgeSOSView } from './components/UrgeSOSView';
import { WarriorGuideView } from './components/WarriorGuideView';
import { useRecoveryStore } from './hooks/useRecoveryStore';
import { useSpiritualReminders } from './hooks/useSpiritualReminders';
import { NavTab, TimeOfDay } from './types/recovery';

function inferCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export default function App() {
  const {
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
  } = useRecoveryStore();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(state.pinCode));
  const [bgImgFailed, setBgImgFailed] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const {
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
  } = useSpiritualReminders({
    isAppReady: !showSplash,
    prefs: state.notifications,
  });

  const salawatBannerNode = (
    <SalawatBanner
      visible={salawatVisible}
      countdown={salawatCountdown}
      runId={salawatRunId}
      onDismiss={dismissSalawatBanner}
    />
  );

  if (showSplash) {
    return (
      <>
        <SplashScreen onComplete={handleSplashComplete} />
        <Analytics />
      </>
    );
  }

  if (isLocked && state.pinCode) {
    return (
      <>
        {salawatBannerNode}
        <PinLockScreen
          expectedPin={state.pinCode}
          onUnlock={() => setIsLocked(false)}
        />
      </>
    );
  }

  if (!state.onboarding.completed) {
    return (
      <>
        {salawatBannerNode}
        <OnboardingScreen
          initialProfile={state.onboarding}
          onComplete={saveOnboarding}
        />
      </>
    );
  }

  const handleQuickVictory = (triggerLabel?: string) => {
    addJournalEntry({
      type: 'victory',
      triggers: [triggerLabel || 'مقاومة سريعة'],
      timeOfDay: inferCurrentTimeOfDay(),
      intensity: 3,
      notes: 'تم تجاوز الرغبة بنجاح عبر التطبيق.',
      resetStreak: false,
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col text-[#1C2912] dark:text-[#F3F6E9]">
      {/* Fixed Full-Viewport Meadow Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#F4F6E8] dark:bg-[#11180E]">
        {!bgImgFailed && (
          <img
            src="/assets/aistudio/86b54ca0988ea52f4dd76be506812c2e_c83167c9.jpg"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setBgImgFailed(true)}
            className="w-full h-full object-cover object-[center_58%]"
          />
        )}
        <div className="absolute inset-0 bg-[#F4F6E8]/25 dark:bg-[#11180E]/65" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {salawatBannerNode}
        <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6">
          <PWAInstallButton variant="banner" />
          {permissionStatus === 'default' && !state.notifications.promptDismissed && (
            <div className="rounded-2xl bg-[#FCFDF7]/92 dark:bg-[#192315]/92 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 text-xs text-[#1C2912] dark:text-[#F3F6E9]">
                <Bell className="w-4 h-4 text-[#C98F0A] dark:text-[#ECC93B] shrink-0" aria-hidden="true" />
                <span>
                  فعّل الإشعارات ليصلك تذكير الصلاة على النبي ﷺ وسؤال «هل لا زلت صامداً؟» كل ساعتين.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void requestNotificationPermission()}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold cursor-pointer"
                >
                  تفعيل الإشعارات
                </button>
                <button
                  type="button"
                  onClick={() => updateNotificationPrefs({ promptDismissed: true })}
                  aria-label="إخفاء"
                  className="p-1.5 rounded-lg text-[#556442] dark:text-[#A2B193] hover:bg-[#E5ECD0]/60 dark:hover:bg-[#2C3B24] cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
          <DashboardView
            state={state}
            onNavigate={setActiveTab}
            onSaveCheckIn={saveDailyCheckIn}
            onQuickVictory={handleQuickVictory}
            onAddReason={addPersonalReason}
            onRemoveReason={removePersonalReason}
            onSelectWeakness={setWeakness}
            onChangeWeaknessNote={setWeaknessCustomNote}
            onMarkSolutionApplied={markDailySolutionApplied}
            onResetStreakExplicit={resetStreakExplicit}
          />
        )}

        {activeTab === 'guide' && (
          <WarriorGuideView
            streakStartedAt={state.streakStartedAt}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'sos' && (
          <UrgeSOSView
            personalReasons={state.personalReasons}
            onWaveSurvived={handleQuickVictory}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView
            journal={state.journal}
            onAddEntry={addJournalEntry}
            onDeleteEntry={deleteJournalEntry}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsShieldView
            state={state}
            onToggleHabitToday={toggleHabitToday}
            onAddHabit={addCustomHabit}
            onRemoveHabit={removeHabit}
            onToggleSafeguard={toggleSafeguard}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettingsView
            state={state}
            notificationPermission={permissionStatus}
            onSetTheme={setTheme}
            onSetStartDate={setStreakStartDate}
            onSetPin={setPinCode}
            onLockNow={() => setIsLocked(true)}
            onSaveOnboarding={saveOnboarding}
            onSelectWeakness={setWeakness}
            onUpdateNotifications={updateNotificationPrefs}
            onRequestNotificationPermission={() => void requestNotificationPermission()}
            onPreviewSalawatBanner={() => triggerSalawatBannerNow(false)}
            onPreviewSteadfastCheck={() => triggerSteadfastCheckNow(true)}
            onImportState={importState}
            onClearAllData={clearAllData}
          />
        )}
      </main>

        <footer className="hidden md:block bg-[#FCFDF7]/85 dark:bg-[#192315]/85 backdrop-blur-md border-t border-[#D5DEC0] dark:border-[#2C3B24] py-5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs text-[#556442] dark:text-[#A2B193]">
            <span>صمود · بياناتك محفوظة محلياً على جهازك فقط بخصوصية كاملة</span>
            <div className="flex items-center gap-4">
              {state.pinCode && (
                <button
                  type="button"
                  onClick={() => setIsLocked(true)}
                  className="inline-flex items-center gap-1.5 hover:text-[#1C2912] dark:hover:text-[#F3F6E9] cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>قفل التطبيق</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 hover:text-[#1C2912] dark:hover:text-[#F3F6E9] cursor-pointer"
              >
                {state.theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>الوضع النهاري</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>الوضع الليلي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>

        <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />
        <SteadfastCheckBanner
          visible={steadfastPromptVisible}
          onConfirmSteadfast={() => {}}
          onNeedSupport={() => setActiveTab('sos')}
          onDismiss={dismissSteadfastPrompt}
        />
        <OfflineIndicator />
        <Analytics />
      </div>
    </div>
  );
}
