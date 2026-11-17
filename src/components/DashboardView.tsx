import {
  Calendar,
  Check,
  ChevronDown,
  Compass,
  Plus,
  RotateCcw,
  ShieldAlert,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  FEATURED_RECOVERY_QUOTE,
  getDailyQuotesForDay,
  RECOVERY_MILESTONES,
  WEAKNESS_PLANS,
} from '../data/recoveryContent';
import { getLocalDateKey } from '../hooks/useRecoveryStore';
import { NavTab, RecoveryState, WeaknessId } from '../types/recovery';
import { VisualQuestionsCard } from './VisualQuestionsCard';

interface DashboardViewProps {
  state: RecoveryState;
  onNavigate: (tab: NavTab) => void;
  onSaveCheckIn: (payload: { mood: number; urgeLevel: number; note: string }) => void;
  onQuickVictory: () => void;
  onAddReason: (reason: string) => void;
  onRemoveReason: (index: number) => void;
  onSelectWeakness: (weaknessId: WeaknessId | null) => void;
  onChangeWeaknessNote: (note: string) => void;
  onMarkSolutionApplied: () => void;
  onResetStreakExplicit: () => void;
  onSelectVisualAnswer: (questionId: string, optionId: string) => void;
  onResetVisualAnswers: () => void;
}

type BottomSectionTab = 'weakness' | 'compass' | 'calendar';

function formatDurationParts(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { days, hours, minutes, seconds };
}

function getRecoveryStatusLabel(pct: number): string {
  if (pct < 20) return 'بداية التوازن';
  if (pct < 45) return 'في تحسّن';
  if (pct < 75) return 'تعافٍ ثابت';
  return 'قوة واستقرار';
}

function getDailyHourAdvice(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'ساعات الصباح هي الأنقى ذهناً — استثمر هذا الصفاء في إنجاز مهمة واضحة.';
  }
  if (hour >= 12 && hour < 17) {
    return 'منتصف اليوم مستقر غالباً؛ انتبه لفترات الفراغ المفاجئة بعد العمل أو الدراسة.';
  }
  if (hour >= 17 && hour < 22) {
    return 'في المساء يضعف قرار الإرادة مع التعب — لا تبقَ وحدك مع شاشة مفتوحة بلا هدف.';
  }
  return 'ساعات الليل المتأخرة هي الأخطر على الصمود؛ أطفئ الشاشة الآن وابدأ بخيار صغير لصالحك.';
}

export function DashboardView({
  state,
  onNavigate,
  onSaveCheckIn,
  onQuickVictory,
  onAddReason,
  onRemoveReason,
  onSelectWeakness,
  onChangeWeaknessNote,
  onMarkSolutionApplied,
  onResetStreakExplicit,
  onSelectVisualAnswer,
  onResetVisualAnswers,
}: DashboardViewProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bottomTab, setBottomTab] = useState<BottomSectionTab>('compass');
  const [selectedMilestoneDays, setSelectedMilestoneDays] = useState<number>(3);
  const [newReason, setNewReason] = useState('');
  const [victoryFeedback, setVictoryFeedback] = useState(false);
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const [confirmFailReset, setConfirmFailReset] = useState(false);

  const todayKey = getLocalDateKey();
  const todayCheckIn = state.checkIns[todayKey];

  const [mood, setMood] = useState<number>(todayCheckIn?.mood ?? 4);
  const [urgeLevel, setUrgeLevel] = useState<number>(todayCheckIn?.urgeLevel ?? 2);
  const [dailyNote, setDailyNote] = useState<string>(todayCheckIn?.note ?? '');
  const [checkInSaved, setCheckInSaved] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startMs = new Date(state.streakStartedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const duration = formatDurationParts(elapsedSeconds);
  const currentDayNumber = duration.days + 1;
  const bestDays = Math.max(duration.days, Math.floor(state.bestStreakSeconds / 86400));

  // Daily 24-hour clock progress
  const nowDate = new Date(nowMs);
  const secondsIntoToday =
    nowDate.getHours() * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds();
  const remainingTodaySeconds = Math.max(0, 86400 - secondsIntoToday);
  const todayProgressPct = Math.round((secondsIntoToday / 86400) * 100);
  const remainingHours = Math.floor(remainingTodaySeconds / 3600);
  const remainingMinutes = Math.floor((remainingTodaySeconds % 3600) / 60);
  const dailyHourAdvice = getDailyHourAdvice(nowDate.getHours());

  // 30-day Somoud challenge metrics
  const completedThirtyDays = Math.min(30, duration.days);
  const remainingThirtyDays = Math.max(0, 30 - completedThirtyDays);
  const thirtyDayPct = Math.round((completedThirtyDays / 30) * 100);
  const isThirtyCompleted = duration.days >= 30;

  // Inner Recovery Capsules metrics
  const moodStats = useMemo(() => {
    const entries = Object.values(state.checkIns);
    if (entries.length === 0) return { avgMood: 3.5, avgHabitsRatio: 0.4 };
    const totalMood = entries.reduce((acc, item) => acc + item.mood, 0);
    const avgMood = totalMood / entries.length;
    const totalHabitRatio = entries.reduce((acc, item) => {
      const denom = Math.max(1, state.habits.length);
      return acc + Math.min(1, item.completedHabitIds.length / denom);
    }, 0);
    return {
      avgMood,
      avgHabitsRatio: totalHabitRatio / entries.length,
    };
  }, [state.checkIns, state.habits.length]);

  const baseDayFactor = Math.min(1, elapsedSeconds / (30 * 86400));
  const moodBonus = ((moodStats.avgMood - 1) / 4) * 18;
  const habitBonus = moodStats.avgHabitsRatio * 18;

  const mentalPct = Math.min(100, Math.max(6, Math.round(baseDayFactor * 82 + moodBonus)));
  const emotionalPct = Math.min(100, Math.max(8, Math.round(baseDayFactor * 78 + moodBonus * 1.1)));
  const focusPct = Math.min(100, Math.max(5, Math.round(baseDayFactor * 80 + habitBonus)));
  const bodyEnergyPct = Math.min(
    100,
    Math.max(10, Math.round(baseDayFactor * 76 + habitBonus * 1.2))
  );

  const dailyQuotes = getDailyQuotesForDay(currentDayNumber);

  // Active Weakness Plan
  const activeWeaknessPlan = useMemo(
    () => WEAKNESS_PLANS.find((w) => w.id === state.selectedWeakness) ?? null,
    [state.selectedWeakness]
  );
  const todaySolutionIndex = activeWeaknessPlan
    ? (currentDayNumber - 1) % activeWeaknessPlan.solutions.length
    : 0;
  const todaySolution = activeWeaknessPlan
    ? activeWeaknessPlan.solutions[todaySolutionIndex]
    : null;
  const appliedToday = state.appliedSolutionDates.includes(todayKey);

  const victoriesCount = useMemo(
    () => state.journal.filter((entry) => entry.type === 'victory').length,
    [state.journal]
  );

  const nextMilestone =
    RECOVERY_MILESTONES.find((m) => duration.days < m.days) ??
    RECOVERY_MILESTONES[RECOVERY_MILESTONES.length - 1];

  useEffect(() => {
    setSelectedMilestoneDays(nextMilestone.days);
  }, [nextMilestone.days]);

  const activeMilestone =
    RECOVERY_MILESTONES.find((m) => m.days === selectedMilestoneDays) ?? RECOVERY_MILESTONES[0];

  // Last 30 days calendar grid
  const last30Days = useMemo(() => {
    const items: {
      key: string;
      dayNum: number;
      label: string;
      status: 'clean' | 'relapse' | 'none';
    }[] = [];
    const streakStartDateKey = getLocalDateKey(new Date(state.streakStartedAt));

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const checkIn = state.checkIns[key];
      let status: 'clean' | 'relapse' | 'none' = 'none';

      if (checkIn?.status === 'relapse') {
        status = 'relapse';
      } else if (checkIn?.status === 'clean') {
        status = 'clean';
      } else if (key >= streakStartDateKey && key <= todayKey) {
        status = 'clean';
      }

      items.push({
        key,
        dayNum: d.getDate(),
        label: d.toLocaleDateString('ar-EG', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        status,
      });
    }
    return items;
  }, [state.checkIns, state.streakStartedAt, todayKey]);

  const [inspectedDayKey, setInspectedDayKey] = useState<string>(todayKey);
  const inspectedCheckIn = state.checkIns[inspectedDayKey];

  const handleSaveCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCheckIn({ mood, urgeLevel, note: dailyNote });
    setCheckInSaved(true);
    window.setTimeout(() => setCheckInSaved(false), 2500);
  };

  const handleQuickVictory = () => {
    onQuickVictory();
    setVictoryFeedback(true);
    window.setTimeout(() => setVictoryFeedback(false), 2500);
  };

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    onAddReason(newReason);
    setNewReason('');
  };

  return (
    <div className="space-y-6">
      {/* Quote + Daily Guidance Strip over Meadow Background */}
      <section
        aria-label="المقولة اليومية وتوجيه الساعة"
        className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 sm:p-6 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#556442] dark:text-[#A2B193]">
          <span className="text-[#9A6B06] dark:text-[#ECC93B] tabular-nums">
            اليوم {currentDayNumber} من رحلتك · الهدف القادم: {nextMilestone.title} ({nextMilestone.days} أيام)
          </span>
          <span>{dailyHourAdvice}</span>
        </div>

        <blockquote className="pt-2 border-t border-[#D5DEC0] dark:border-[#2C3B24] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="font-display text-lg sm:text-xl font-bold text-[#1C2912] dark:text-[#F3F6E9] leading-snug text-balance">
            «{FEATURED_RECOVERY_QUOTE.text}»
          </h1>
          <footer className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B] whitespace-nowrap shrink-0">
            — {FEATURED_RECOVERY_QUOTE.author}
          </footer>
        </blockquote>
      </section>

      {/* BAND 1: 4-Column Symmetrical KPI Strip */}
      <section aria-label="ملخص الصمود اليومي">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Current Streak */}
          <div className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-xs font-medium text-[#556442] dark:text-[#A2B193]">
              عداد الصمود المستمر
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-num text-3xl font-bold text-[#9A6B06] dark:text-[#ECC93B]">
                {duration.days}
              </span>
              <span className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">يوم</span>
            </div>
            <div className="mt-2 font-mono-num text-xs text-[#556442] dark:text-[#A2B193]">
              {String(duration.hours).padStart(2, '0')}س : {String(duration.minutes).padStart(2, '0')}د :{' '}
              {String(duration.seconds).padStart(2, '0')}ث
            </div>
          </div>

          {/* KPI 2: Daily Hours Clock */}
          <div className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-[#556442] dark:text-[#A2B193]">
              <span>ساعة يومك الآن</span>
              <span className="tabular-nums">{todayProgressPct}%</span>
            </div>
            <div className="mt-2 font-mono-num text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
              {String(nowDate.getHours()).padStart(2, '0')}:
              {String(nowDate.getMinutes()).padStart(2, '0')}:
              {String(nowDate.getSeconds()).padStart(2, '0')}
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B]"
                  style={{ width: `${Math.max(2, todayProgressPct)}%` }}
                />
              </div>
              <div className="text-[11px] text-[#556442] dark:text-[#A2B193] tabular-nums">
                بقي {remainingHours}س و {remainingMinutes}د حتى منتصف الليل
              </div>
            </div>
          </div>

          {/* KPI 3: 30-Day Challenge Progress */}
          <div className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-[#556442] dark:text-[#A2B193]">
              <span>تحدي ٣٠ يوماً</span>
              <span className="tabular-nums">{thirtyDayPct}%</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-mono-num text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
                {completedThirtyDays}
              </span>
              <span className="text-sm text-[#556442] dark:text-[#A2B193] font-mono-num">/ ٣٠</span>
            </div>
            <div className="mt-2 text-xs text-[#556442] dark:text-[#A2B193] tabular-nums">
              {isThirtyCompleted
                ? 'أتممت الشهر الأول بنجاح'
                : `بقي ${remainingThirtyDays} يوماً لإتمام التحدي`}
            </div>
          </div>

          {/* KPI 4: Personal Best & Victories */}
          <div className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-xs font-medium text-[#556442] dark:text-[#A2B193]">
              أطول سلسلة والانتصارات
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-num text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
                {bestDays}
              </span>
              <span className="text-sm text-[#556442] dark:text-[#A2B193]">يوم قياسي</span>
            </div>
            <div className="mt-2 text-xs text-[#556442] dark:text-[#A2B193] tabular-nums">
              انتصارات مسجلة: {victoriesCount} · اليوم {currentDayNumber}
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: Balanced 12-Column Core Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Right Column (7 cols): 30-Day Somoud Grid + Quick Actions + Two Inner Recovery Capsules */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* 30-Day Challenge + Action Strip */}
          <section
            aria-labelledby="thirty-day-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="thirty-day-heading"
                  className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
                >
                  {isThirtyCompleted ? 'أتممت ٣٠ يوماً من الصمود!' : 'شبكة ٣٠ يوماً من الصمود'}
                </h2>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                  {isThirtyCompleted
                    ? 'السلسلة مستمرة معك لبناء مرحلة الثبات الدائم.'
                    : `أنت في اليوم ${currentDayNumber} — كل يوم تصمد فيه يتلوّن بالذهبي.`}
                </p>
              </div>
              <span className="font-mono-num text-xs font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                {thirtyDayPct}%
              </span>
            </div>

            {/* 30 Tiles Grid (10x3 on desktop, 6x5 on mobile) */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              {Array.from({ length: 30 }, (_, idx) => {
                const dayNum = idx + 1;
                const isDone = duration.days >= dayNum;
                const isCurrentTarget = !isThirtyCompleted && dayNum === completedThirtyDays + 1;

                return (
                  <div
                    key={dayNum}
                    className={`h-10 rounded-lg border flex items-center justify-center text-xs font-mono-num font-semibold transition-colors ${
                      isDone
                        ? 'bg-[#FEF4BE] border-[#D9A714] text-[#785204] dark:bg-[#ECC93B]/20 dark:border-[#ECC93B] dark:text-[#F8DF6B]'
                        : isCurrentTarget
                        ? 'bg-[#F4F6E8] dark:bg-[#222F1C] border-[#C98F0A] dark:border-[#ECC93B] text-[#1C2912] dark:text-[#F3F6E9] ring-2 ring-[#C98F0A]/20'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : dayNum}
                  </div>
                );
              })}
            </div>

            {/* Unified Action Bar (Victory + SOS + Explicit Red Reset) */}
            <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleQuickVictory}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{victoryFeedback ? 'تم تسجيل الانتصار' : 'تغلبت على رغبة الآن'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('sos')}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] bg-[#F4F6E8] dark:bg-[#222F1C] hover:bg-[#E5ECD0] dark:hover:bg-[#2B3B24] text-[#1C2912] dark:text-[#F3F6E9] text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#C98F0A] dark:text-[#ECC93B]" aria-hidden="true" />
                  <span>بروتوكول الطوارئ</span>
                </button>

                {!confirmFailReset && (
                  <button
                    type="button"
                    onClick={() => setConfirmFailReset(true)}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-medium whitespace-nowrap cursor-pointer transition-colors sm:mr-auto"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>لقد فشلت، أعد</span>
                  </button>
                )}
              </div>

              {confirmFailReset && (
                <div className="p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#DC2626] dark:text-[#FCA5A5]">
                      هل تريد فعلاً إعادة العدّاد من الصفر؟
                    </div>
                    <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                      يُحفظ رقمك القياسي السابق ويُسجّل اليوم كيوم عودة دون حذف ملاحظاتك.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onResetStreakExplicit();
                        setConfirmFailReset(false);
                      }}
                      className="min-h-[40px] px-3.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      نعم، أعد من الصفر
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmFailReset(false)}
                      className="min-h-[40px] px-3.5 rounded-lg bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9] text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      لا، أكمل صمودي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Two Symmetrical Inner Recovery Capsules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            {/* Capsule 1: Mental & Emotional Health */}
            <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  الصحة الذهنية والنفسية
                </h2>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#1C2912] dark:text-[#F3F6E9]">
                        الصحة العقلية · {getRecoveryStatusLabel(mentalPct)}
                      </span>
                      <span className="font-mono-num font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                        {mentalPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B]"
                        style={{ width: `${mentalPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#1C2912] dark:text-[#F3F6E9]">
                        الصحة النفسية · {getRecoveryStatusLabel(emotionalPct)}
                      </span>
                      <span className="font-mono-num font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                        {emotionalPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B]"
                        style={{ width: `${emotionalPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
                <div className="text-[11px] font-medium text-[#9A6B06] dark:text-[#ECC93B]">
                  عبارة اليوم {currentDayNumber} النفسية
                </div>
                <p className="text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] mt-1 leading-relaxed">
                  {dailyQuotes.mental}
                </p>
              </div>
            </section>

            {/* Capsule 2: Focus & Physical Activity */}
            <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  التركيز ونشاط الجسم
                </h2>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#1C2912] dark:text-[#F3F6E9]">
                        التركيز · {getRecoveryStatusLabel(focusPct)}
                      </span>
                      <span className="font-mono-num font-semibold text-[#2F6E1B] dark:text-[#65C449]">
                        {focusPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2F6E1B] dark:bg-[#65C449]"
                        style={{ width: `${focusPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#1C2912] dark:text-[#F3F6E9]">
                        نشاط الجسم · {getRecoveryStatusLabel(bodyEnergyPct)}
                      </span>
                      <span className="font-mono-num font-semibold text-[#2F6E1B] dark:text-[#65C449]">
                        {bodyEnergyPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2F6E1B] dark:bg-[#65C449]"
                        style={{ width: `${bodyEnergyPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
                <div className="text-[11px] font-medium text-[#2F6E1B] dark:text-[#65C449]">
                  عبارة اليوم {currentDayNumber} للطاقة
                </div>
                <p className="text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] mt-1 leading-relaxed">
                  {dailyQuotes.focus}
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Left Column (5 cols): Daily Check-In + Personal Reasons */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Daily Check-in */}
          <section
            aria-labelledby="checkin-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
          >
            <h2
              id="checkin-heading"
              className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              تقييم اليوم السريع
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
              يغذي مؤشرات التعافي ويحفظ حالة يومك
            </p>

            <form onSubmit={handleSaveCheckIn} className="mt-4 space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1C2912] dark:text-[#F3F6E9]">المزاج</span>
                  <span className="text-[#556442] dark:text-[#A2B193] tabular-nums">{mood} / ٥</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMood(val)}
                      className={`min-h-[38px] rounded-lg text-xs font-mono-num font-semibold border transition-colors cursor-pointer ${
                        mood === val
                          ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1C2912] dark:text-[#F3F6E9]">شدة الرغبة</span>
                  <span className="text-[#556442] dark:text-[#A2B193] tabular-nums">
                    {urgeLevel} / ٥
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setUrgeLevel(val)}
                      className={`min-h-[38px] rounded-lg text-xs font-mono-num font-semibold border transition-colors cursor-pointer ${
                        urgeLevel === val
                          ? 'bg-[#2F6318] border-[#2F6318] text-white dark:bg-[#F3F6E9] dark:border-[#F3F6E9] dark:text-[#11180E]'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="daily-note-input" className="sr-only">
                  ملاحظة مختصرة لليوم
                </label>
                <textarea
                  id="daily-note-input"
                  rows={2}
                  value={dailyNote}
                  onChange={(e) => setDailyNote(e.target.value)}
                  placeholder="سطر مختصر عن يومك..."
                  className="w-full p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[42px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                {checkInSaved ? 'تم حفظ تقييم اليوم' : 'حفظ تقييم اليوم'}
              </button>
            </form>
          </section>

          {/* Personal Reasons */}
          <section
            aria-labelledby="reasons-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex-1 flex flex-col justify-between"
          >
            <div>
              <h2
                id="reasons-heading"
                className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                لماذا قررت التوقف؟
              </h2>

              <ul className="mt-3 divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
                {state.personalReasons.map((reason, index) => (
                  <li
                    key={`${index}-${reason.slice(0, 12)}`}
                    className="flex items-start justify-between gap-2 py-2.5 text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed"
                  >
                    <span>{reason}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveReason(index)}
                      aria-label="حذف السبب"
                      className="p-1 text-[#556442] hover:text-[#DC2626] dark:text-[#A2B193] dark:hover:text-[#F87171] shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <form
              onSubmit={handleAddReason}
              className="mt-4 pt-3 border-t border-[#D5DEC0] dark:border-[#2C3B24] flex gap-2"
            >
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="أضف سبباً جديداً..."
                className="flex-1 min-w-0 min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
              />
              <button
                type="submit"
                className="min-h-[42px] px-3.5 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9] text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>إضافة</span>
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* BAND 3: Organized Segmented Sub-Sections */}
      <section aria-label="أقسام التعمق والمتابعة" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="أقسام الخطة والتحليل"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24]"
          >
            {[
              { id: 'compass', label: 'البوصلة المصوّرة', icon: Compass },
              { id: 'weakness', label: 'خطة نقطة الضعف', icon: Target },
              { id: 'calendar', label: 'التقويم ومراحل ٩٠ يوماً', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = bottomTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setBottomTab(tab.id as BottomSectionTab)}
                  className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                      : 'text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Visual Compass Questions */}
        {bottomTab === 'compass' && (
          <VisualQuestionsCard
            answers={state.visualAnswers}
            onSelectAnswer={onSelectVisualAnswer}
            onResetAnswers={onResetVisualAnswers}
          />
        )}

        {/* Tab 2: Weakness Question & Proven Solutions */}
        {bottomTab === 'weakness' && (
          <section
            aria-labelledby="weakness-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
          >
            {!activeWeaknessPlan ? (
              <div className="space-y-4">
                <div>
                  <h2
                    id="weakness-heading"
                    className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
                  >
                    ما أكثر شيء يجعلك تعود إليها؟
                  </h2>
                  <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                    اختر نقطة ضعفك الأساسية لنعطيك خطة يومية وحلولاً عملية مجربة تناسب حالتك
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {WEAKNESS_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onSelectWeakness(plan.id)}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] hover:border-[#C98F0A] dark:hover:border-[#ECC93B] text-right text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] transition-colors cursor-pointer"
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="weakness-note-input"
                    className="block text-xs font-medium text-[#556442] dark:text-[#A2B193] mb-1.5"
                  >
                    اكتب تجربتك بكلماتك (اختياري)
                  </label>
                  <textarea
                    id="weakness-note-input"
                    rows={2}
                    value={state.weaknessCustomNote}
                    onChange={(e) => onChangeWeaknessNote(e.target.value)}
                    placeholder="مثال: أضعف غالباً بعد الساعة ١١ ليلاً عندما أكون متوتراً..."
                    className="w-full p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B]">
                      نقطة ضعفك المحددة · {activeWeaknessPlan.label}
                    </div>
                    <h2
                      id="weakness-heading"
                      className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9] mt-1"
                    >
                      خطتك الشخصية وحلول مجربة لحالتك
                    </h2>
                    <p className="text-sm text-[#556442] dark:text-[#A2B193] mt-1.5 leading-relaxed max-w-3xl">
                      {activeWeaknessPlan.whyItHappens}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectWeakness(null)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    تغيير نقطة الضعف
                  </button>
                </div>

                {todaySolution && (
                  <div className="p-4 sm:p-5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B]">
                        خطوة اليوم الموصى بها
                      </div>
                      <div className="text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                        {todaySolution.title}
                      </div>
                      <p className="text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
                        {todaySolution.detail}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onMarkSolutionApplied}
                      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        appliedToday
                          ? 'bg-[#2F6E1B]/15 text-[#2F6E1B] dark:bg-[#65C449]/20 dark:text-[#65C449]'
                          : 'bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] text-white dark:text-[#11180E]'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>طبّقتها اليوم</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAllSolutions((prev) => !prev)}
                    className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
                  >
                    <span>
                      {showAllSolutions
                        ? 'إخفاء بقية الحلول'
                        : `عرض جميع الحلول المجربة لـ «${activeWeaknessPlan.label}» (${activeWeaknessPlan.solutions.length})`}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-150 ${
                        showAllSolutions ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {state.weaknessCustomNote && (
                    <span className="text-xs text-[#556442] dark:text-[#A2B193]">
                      ملاحظتك: «{state.weaknessCustomNote}»
                    </span>
                  )}
                </div>

                {showAllSolutions && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {activeWeaknessPlan.solutions.map((sol, idx) => (
                      <div
                        key={sol.title}
                        className="p-4 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]"
                      >
                        <div className="text-xs text-[#9A6B06] dark:text-[#ECC93B] font-semibold">
                          حل {idx + 1} · {sol.title}
                        </div>
                        <p className="text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] mt-1.5 leading-relaxed">
                          {sol.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Calendar + 90-Day Scientific Milestones */}
        {bottomTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* 30-Day Calendar Matrix (7 cols) */}
            <section
              aria-labelledby="calendar-heading"
              className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2
                    id="calendar-heading"
                    className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
                  >
                    تقويم الالتزام (آخر ٣٠ يوماً)
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-[#556442] dark:text-[#A2B193]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#C98F0A] dark:bg-[#ECC93B]" />
                      <span>صمود</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
                      <span>عودة</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#D5DEC0] dark:bg-[#2C3B24]" />
                      <span>غير مسجل</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                  {last30Days.map((day) => {
                    const isSelected = inspectedDayKey === day.key;
                    const isToday = day.key === todayKey;
                    let colorClasses =
                      'bg-[#F4F6E8] dark:bg-[#11180E] text-[#556442] dark:text-[#A2B193] border-transparent';
                    if (day.status === 'clean') {
                      colorClasses =
                        'bg-[#FEF4BE] dark:bg-[#ECC93B]/20 text-[#785204] dark:text-[#F8DF6B] border-[#D9A714]/40';
                    } else if (day.status === 'relapse') {
                      colorClasses =
                        'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40 text-[#B91C1C] dark:text-[#FCA5A5] border-[#DC2626]/40';
                    }

                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setInspectedDayKey(day.key)}
                        title={day.label}
                        className={`min-h-[42px] rounded-xl border text-xs font-mono-num font-medium flex flex-col items-center justify-center cursor-pointer ${colorClasses} ${
                          isSelected ? 'ring-2 ring-[#2F6318] dark:ring-[#F3F6E9]' : ''
                        }`}
                      >
                        <span>{day.dayNum}</span>
                        {isToday && (
                          <span className="text-[9px] font-sans leading-none mt-0.5">اليوم</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm">
                <div className="text-xs text-[#556442] dark:text-[#A2B193]">
                  تفاصيل يوم {inspectedDayKey}
                </div>
                {inspectedCheckIn ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[#1C2912] dark:text-[#F3F6E9]">
                    <span>
                      {inspectedCheckIn.status === 'relapse'
                        ? 'يوم عودة وتصحيح مسار'
                        : 'يوم صمود'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">المزاج: {inspectedCheckIn.mood}/٥</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">الرغبة: {inspectedCheckIn.urgeLevel}/٥</span>
                    {inspectedCheckIn.note && (
                      <p className="w-full text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                        “{inspectedCheckIn.note}”
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                    لا يوجد تقييم يدوي مسجل لهذا اليوم بعد.
                  </p>
                )}
              </div>
            </section>

            {/* 90-Day Milestones (5 cols) */}
            <section
              aria-labelledby="milestones-heading"
              className="lg:col-span-5 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <h2
                  id="milestones-heading"
                  className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
                >
                  مراحل التعافي العصبي (٩٠ يوماً)
                </h2>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {RECOVERY_MILESTONES.map((milestone) => {
                    const reached = duration.days >= milestone.days;
                    const selected = activeMilestone.days === milestone.days;
                    return (
                      <button
                        key={milestone.days}
                        type="button"
                        onClick={() => setSelectedMilestoneDays(milestone.days)}
                        className={`text-right p-3 rounded-xl border transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#C98F0A] bg-[#C98F0A]/10 dark:border-[#ECC93B] dark:bg-[#ECC93B]/10'
                            : 'border-[#D5DEC0] dark:border-[#2C3B24] hover:bg-[#F4F6E8] dark:hover:bg-[#222F1C]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono-num text-xs font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                            {milestone.days}ي
                          </span>
                          {reached && (
                            <Check
                              className="w-3.5 h-3.5 text-[#2F6E1B] dark:text-[#65C449] shrink-0"
                              aria-label="مكتملة"
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-[#556442] dark:text-[#A2B193] mt-1 truncate">
                          {milestone.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
                <div className="text-xs text-[#9A6B06] dark:text-[#ECC93B] font-medium">
                  {activeMilestone.subtitle} · {activeMilestone.title}
                </div>
                <p className="text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] mt-1 leading-relaxed">
                  {activeMilestone.scienceNote}
                </p>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
