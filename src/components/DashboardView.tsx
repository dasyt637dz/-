import {
  Calendar,
  Check,
  ChevronDown,
  Crown,
  RotateCcw,
  ShieldAlert,
  Target,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  FEATURED_RECOVERY_QUOTE,
  getDailyQuotesForDay,
  getStreakTitleInfo,
  RECOVERY_MILESTONES,
  WEAKNESS_PLANS,
} from '../data/recoveryContent';
import { getLocalDateKey, getStreakMetrics } from '../hooks/useRecoveryStore';
import { NavTab, RecoveryState, WeaknessId } from '../types/recovery';
import { DailyCheckInCard } from './DailyCheckInCard';
import { BodyFillFigure, BrainFillFigure } from './RecoveryFillFigures';

interface DashboardViewProps {
  state: RecoveryState;
  onNavigate: (tab: NavTab) => void;
  onSaveCheckIn: (payload: {
    mood: number;
    urgeLevel: number;
    note: string;
    tags?: string[];
  }) => void;
  onQuickVictory: () => void;
  onSelectWeakness: (weaknessId: WeaknessId | null) => void;
  onChangeWeaknessNote: (note: string) => void;
  onMarkSolutionApplied: () => void;
  onResetStreakExplicit: () => void;
}

type BottomSectionTab = 'weakness' | 'calendar';

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
  onSelectWeakness,
  onChangeWeaknessNote,
  onMarkSolutionApplied,
  onResetStreakExplicit,
}: DashboardViewProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bottomTab, setBottomTab] = useState<BottomSectionTab>('weakness');
  const [selectedMilestoneDays, setSelectedMilestoneDays] = useState<number>(3);
  const [victoryFeedback, setVictoryFeedback] = useState(false);
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const [confirmFailReset, setConfirmFailReset] = useState(false);

  const nowDate = new Date(nowMs);
  const todayKey = getLocalDateKey(nowDate);
  const todayCheckIn = state.checkIns[todayKey];
  const isDailyCheckInCompleted = Boolean(todayCheckIn?.checkedInAt);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const duration = getStreakMetrics(state.streakStartedAt, nowMs);
  const elapsedSeconds = duration.elapsedSeconds;
  const currentDayNumber = duration.days + 1;
  const bestDays = Math.max(duration.days, Math.floor(state.bestStreakSeconds / 86400));

  const dailyHourAdvice = getDailyHourAdvice(nowDate.getHours());

  const titleInfo = getStreakTitleInfo(duration.days);
  const earnedCups = Math.min(10, Math.floor(duration.days / 3));
  const earnedCrowns = Math.min(6, Math.floor(duration.days / 5));

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

  const baseDayFactor = Math.min(
    1,
    Math.max(elapsedSeconds, duration.days * 86400) / (30 * 86400)
  );
  const moodBonus = ((moodStats.avgMood - 1) / 4) * 18;
  const habitBonus = moodStats.avgHabitsRatio * 18;

  const mentalPct = Math.min(100, Math.max(6, Math.round(baseDayFactor * 82 + moodBonus)));
  const emotionalPct = Math.min(100, Math.max(8, Math.round(baseDayFactor * 78 + moodBonus * 1.1)));
  const focusPct = Math.min(100, Math.max(5, Math.round(baseDayFactor * 80 + habitBonus)));
  const bodyEnergyPct = Math.min(
    100,
    Math.max(10, Math.round(baseDayFactor * 76 + habitBonus * 1.2))
  );
  const brainFillPct = Math.round((mentalPct + emotionalPct) / 2);
  const bodyFillPct = Math.round((focusPct + bodyEnergyPct) / 2);

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

  const handleQuickVictory = () => {
    onQuickVictory();
    setVictoryFeedback(true);
    window.setTimeout(() => setVictoryFeedback(false), 2500);
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
          {FEATURED_RECOVERY_QUOTE.author && (
            <footer className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B] whitespace-nowrap shrink-0">
              — {FEATURED_RECOVERY_QUOTE.author}
            </footer>
          )}
        </blockquote>
      </section>

      {/* BAND 1: 2-Column Symmetrical KPI Strip */}
      <section aria-label="ملخص الصمود اليومي">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {/* KPI 1: Current Streak & 30-Day Challenge Combined */}
          <div className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#556442] dark:text-[#A2B193]">
              <span>عداد الصمود المستمر</span>
              <span className="tabular-nums">تحدي ٣٠ يوماً · {thirtyDayPct}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-num text-3xl font-bold text-[#9A6B06] dark:text-[#ECC93B]">
                    {duration.days}
                  </span>
                  <span className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">يوم</span>
                </div>
                <div className="mt-1.5 font-mono-num text-xs text-[#556442] dark:text-[#A2B193]">
                  {String(duration.hours).padStart(2, '0')}س : {String(duration.minutes).padStart(2, '0')}د :{' '}
                  {String(duration.seconds).padStart(2, '0')}ث
                </div>
              </div>

              <div className="pr-4 border-r border-[#D5DEC0] dark:border-[#2C3B24]">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono-num text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
                    {completedThirtyDays}
                  </span>
                  <span className="text-sm text-[#556442] dark:text-[#A2B193] font-mono-num">/ ٣٠</span>
                </div>
                <div className="mt-1.5 text-xs text-[#556442] dark:text-[#A2B193] tabular-nums">
                  {isThirtyCompleted
                    ? 'أتممت الشهر الأول بنجاح'
                    : `بقي ${remainingThirtyDays} يوماً لإتمام التحدي`}
                </div>
              </div>
            </div>
          </div>

          {/* KPI 2: Personal Best & Victories */}
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
              لقبك: <span className="font-semibold text-[#9A6B06] dark:text-[#ECC93B]">{titleInfo.current.title}</span> · انتصارات: {victoriesCount}
            </div>
          </div>
        </div>
      </section>

      {/* BAND 2: Core Workspace */}
      <div className="space-y-6">
        <div
          className={
            isDailyCheckInCompleted
              ? 'w-full'
              : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch'
          }
        >
          {/* 30-Day Challenge + Action Strip */}
          <section
            aria-labelledby="thirty-day-heading"
            className={`${
              isDailyCheckInCompleted ? '' : 'lg:col-span-7 '
            }bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between space-y-5`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="thirty-day-heading"
                  className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
                >
                  {isThirtyCompleted ? 'أتممت ٣٠ يوماً — محارب حقيقي!' : 'شبكة ٣٠ يوماً من الصمود'}
                </h2>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                  لقبك الحالي:{' '}
                  <span className="font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                    {titleInfo.current.title}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 text-[#9A6B06] dark:text-[#ECC93B] tabular-nums">
                  <Trophy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{earnedCups} / ١٠</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#9A6B06] dark:text-[#ECC93B] tabular-nums">
                  <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{earnedCrowns} / ٦</span>
                </span>
                <span className="font-mono-num text-[#9A6B06] dark:text-[#ECC93B]">
                  {thirtyDayPct}%
                </span>
              </div>
            </div>

            {/* 30 Tiles Grid (10x3 on desktop, 6x5 on mobile) with Trophy Cup above every 3rd day & Crown above every 5th day */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-x-2 gap-y-2.5">
              {Array.from({ length: 30 }, (_, idx) => {
                const dayNum = idx + 1;
                const isDone = duration.days >= dayNum;
                const isCurrentTarget = !isThirtyCompleted && dayNum === completedThirtyDays + 1;
                const hasCup = dayNum % 3 === 0;
                const hasCrown = dayNum % 5 === 0;

                return (
                  <div
                    key={dayNum}
                    className="flex flex-col items-center"
                    title={
                      hasCup && hasCrown
                        ? `اليوم ${dayNum} · كأس وتاج الصمود`
                        : hasCup
                        ? `اليوم ${dayNum} · كأس الصمود`
                        : hasCrown
                        ? `اليوم ${dayNum} · تاج الصمود`
                        : `اليوم ${dayNum}`
                    }
                  >
                    <div className="h-4 flex items-center justify-center gap-0.5 mb-1">
                      {hasCup && (
                        <Trophy
                          className={`w-3.5 h-3.5 ${
                            isDone
                              ? 'text-[#C98F0A] dark:text-[#ECC93B] fill-[#C98F0A]/25 dark:fill-[#ECC93B]/30'
                              : 'text-[#B5C19B] dark:text-[#4A5A40]'
                          }`}
                          aria-label={`كأس اليوم ${dayNum}`}
                        />
                      )}
                      {hasCrown && (
                        <Crown
                          className={`w-3.5 h-3.5 ${
                            isDone
                              ? 'text-[#C98F0A] dark:text-[#ECC93B] fill-[#C98F0A]/25 dark:fill-[#ECC93B]/30'
                              : 'text-[#B5C19B] dark:text-[#4A5A40]'
                          }`}
                          aria-label={`تاج اليوم ${dayNum}`}
                        />
                      )}
                    </div>
                    <div
                      className={`w-full h-10 rounded-lg border flex items-center justify-center text-xs font-mono-num font-semibold transition-colors ${
                        isDone
                          ? 'bg-[#FEF4BE] border-[#D9A714] text-[#785204] dark:bg-[#ECC93B]/20 dark:border-[#ECC93B] dark:text-[#F8DF6B]'
                          : isCurrentTarget
                          ? 'bg-[#F4F6E8] dark:bg-[#222F1C] border-[#C98F0A] dark:border-[#ECC93B] text-[#1C2912] dark:text-[#F3F6E9] ring-2 ring-[#C98F0A]/20'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : dayNum}
                    </div>
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

          {!isDailyCheckInCompleted && (
            <div className="lg:col-span-5 flex flex-col">
              <DailyCheckInCard
                todayKey={todayKey}
                todayCheckIn={todayCheckIn}
                onSaveCheckIn={onSaveCheckIn}
                onNavigate={onNavigate}
              />
            </div>
          )}
        </div>

        {/* Two Symmetrical Recovery Figures: Brain (Mental & Emotional) + Person (Focus & Body) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Capsule 1: Mental & Emotional Health — Filling Brain */}
          <section
            aria-labelledby="brain-health-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="brain-health-heading"
                className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                الصحة الذهنية والنفسية
              </h2>
              <span className="font-mono-num text-sm font-bold text-[#9A6B06] dark:text-[#ECC93B]">
                {brainFillPct}%
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <BrainFillFigure
                percentage={brainFillPct}
                ariaLabel={`امتلاء الدماغ للصحة الذهنية والنفسية بنسبة ${brainFillPct} في المئة`}
              />

              <div className="flex-1 w-full space-y-3 text-center sm:text-right">
                <div>
                  <div className="text-xs text-[#556442] dark:text-[#A2B193]">
                    حالة التعافي الذهني
                  </div>
                  <div className="text-lg font-display font-bold text-[#9A6B06] dark:text-[#ECC93B] mt-0.5">
                    {getRecoveryStatusLabel(brainFillPct)}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#D5DEC0] dark:border-[#2C3B24] text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#556442] dark:text-[#A2B193]">الصحة العقلية</span>
                    <span className="font-mono-num font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                      {mentalPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#556442] dark:text-[#A2B193]">الصحة النفسية</span>
                    <span className="font-mono-num font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                      {emotionalPct}%
                    </span>
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

          {/* Capsule 2: Focus & Physical Activity — Filling Person */}
          <section
            aria-labelledby="body-focus-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="body-focus-heading"
                className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                التركيز ونشاط الجسم
              </h2>
              <span className="font-mono-num text-sm font-bold text-[#2F6E1B] dark:text-[#65C449]">
                {bodyFillPct}%
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <BodyFillFigure
                percentage={bodyFillPct}
                ariaLabel={`امتلاء الجسم للتركيز ونشاط الجسم بنسبة ${bodyFillPct} في المئة`}
              />

              <div className="flex-1 w-full space-y-3 text-center sm:text-right">
                <div>
                  <div className="text-xs text-[#556442] dark:text-[#A2B193]">
                    حالة النشاط والتركيز
                  </div>
                  <div className="text-lg font-display font-bold text-[#2F6E1B] dark:text-[#65C449] mt-0.5">
                    {getRecoveryStatusLabel(bodyFillPct)}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#D5DEC0] dark:border-[#2C3B24] text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#556442] dark:text-[#A2B193]">التركيز</span>
                    <span className="font-mono-num font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                      {focusPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#556442] dark:text-[#A2B193]">نشاط الجسم</span>
                    <span className="font-mono-num font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                      {bodyEnergyPct}%
                    </span>
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

      {/* BAND 3: Organized Segmented Sub-Sections */}
      <section aria-label="أقسام التعمق والمتابعة" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="أقسام الخطة والتحليل"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24]"
          >
            {[
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
                    {inspectedCheckIn.tags && inspectedCheckIn.tags.length > 0 && (
                      <div className="w-full flex flex-wrap gap-1.5 mt-1">
                        {inspectedCheckIn.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-lg bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-[11px] text-[#556442] dark:text-[#A2B193]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
