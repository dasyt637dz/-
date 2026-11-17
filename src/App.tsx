import { Lock, Moon, Sun } from 'lucide-react';
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
import { SplashScreen } from './components/SplashScreen';
import { TopBar } from './components/TopBar';
import { UrgeSOSView } from './components/UrgeSOSView';
import { WarriorGuideView } from './components/WarriorGuideView';
import { useRecoveryStore } from './hooks/useRecoveryStore';
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
    setVisualAnswer,
    resetVisualAnswers,
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

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (isLocked && state.pinCode) {
    return (
      <PinLockScreen
        expectedPin={state.pinCode}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  if (!state.onboarding.completed) {
    return (
      <OnboardingScreen
        initialProfile={state.onboarding}
        initialVisualAnswers={state.visualAnswers}
        onComplete={saveOnboarding}
      />
    );
  }

  const handleQuickVictory = () => {
    addJournalEntry({
      type: 'victory',
      triggers: ['مقاومة سريعة'],
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
        <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6">
          <PWAInstallButton variant="banner" />
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
            onSelectVisualAnswer={setVisualAnswer}
            onResetVisualAnswers={resetVisualAnswers}
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
            onSetTheme={setTheme}
            onSetStartDate={setStreakStartDate}
            onSetPin={setPinCode}
            onLockNow={() => setIsLocked(true)}
            onSaveOnboarding={saveOnboarding}
            onSelectWeakness={setWeakness}
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
        <OfflineIndicator />
      </div>
    </div>
  );
}
