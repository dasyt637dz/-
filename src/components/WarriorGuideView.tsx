import { Check, ChevronDown, RefreshCw, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  WARRIOR_DAILY_TIPS,
  WARRIOR_PSYCH_NOTES,
  WARRIOR_PSYCH_STAGES,
} from '../data/recoveryContent';
import { getStreakMetrics } from '../hooks/useRecoveryStore';
import { NavTab, WarriorTipCategory } from '../types/recovery';

interface WarriorGuideViewProps {
  streakStartedAt: string;
  onNavigate: (tab: NavTab) => void;
}

type TipFilter = 'all' | WarriorTipCategory;

const TIP_FILTERS: { id: TipFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'morning', label: 'صباحاً' },
  { id: 'free_time', label: 'وقت الفراغ' },
  { id: 'night', label: 'قبل النوم' },
  { id: 'mindset', label: 'الذهن والتركيز' },
];

export function WarriorGuideView({ streakStartedAt, onNavigate }: WarriorGuideViewProps) {
  const currentDayNumber = useMemo(() => {
    return getStreakMetrics(streakStartedAt).days + 1;
  }, [streakStartedAt]);

  const activeStage = useMemo(() => {
    return (
      WARRIOR_PSYCH_STAGES.find(
        (stage) =>
          currentDayNumber >= stage.minDay &&
          (stage.maxDay === null || currentDayNumber <= stage.maxDay)
      ) ?? WARRIOR_PSYCH_STAGES[0]
    );
  }, [currentDayNumber]);

  const [selectedStageId, setSelectedStageId] = useState<string>(activeStage.id);
  const [tipFilter, setTipFilter] = useState<TipFilter>('all');
  const [spotlightOffset, setSpotlightOffset] = useState(0);
  const [openNoteId, setOpenNoteId] = useState<string | null>(WARRIOR_PSYCH_NOTES[0].id);

  const spotlightTip = useMemo(() => {
    const idx = (currentDayNumber - 1 + spotlightOffset) % WARRIOR_DAILY_TIPS.length;
    return WARRIOR_DAILY_TIPS[idx];
  }, [currentDayNumber, spotlightOffset]);

  const filteredTips = useMemo(() => {
    if (tipFilter === 'all') return WARRIOR_DAILY_TIPS;
    return WARRIOR_DAILY_TIPS.filter((tip) => tip.category === tipFilter);
  }, [tipFilter]);

  const inspectedStage =
    WARRIOR_PSYCH_STAGES.find((stage) => stage.id === selectedStageId) ?? activeStage;

  return (
    <div className="space-y-6">
      {/* Header + Current Stage & Daily Warrior Advice Spotlight */}
      <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B] tabular-nums">
              اليوم {currentDayNumber} من الصمود · مرحلتك الحالية: {activeStage.title}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9] mt-1 text-balance">
              دليل المحارب
            </h1>
            <p className="text-sm text-[#556442] dark:text-[#A2B193] mt-1.5 leading-relaxed">
              نصائح يومية عملية وتفسيرات نفسية قصيرة تساعدك على فهم ما يحدث داخل ذهنك في كل مرحلة من رحلة التعافي.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('sos')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>بروتوكول الطوارئ</span>
          </button>
        </div>

        {/* Today's Spotlight Tip */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B]">
              نصيحة اليوم للمحارب · {spotlightTip.categoryLabel}
            </div>
            <div className="text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              {spotlightTip.title}
            </div>
            <p className="text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
              {spotlightTip.detail}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSpotlightOffset((prev) => prev + 1)}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#FCFDF7] dark:bg-[#192315] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] hover:border-[#C98F0A] dark:hover:border-[#ECC93B] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>نصيحة أخرى</span>
          </button>
        </div>
      </section>

      {/* Psychological Stages of Recovery */}
      <section
        aria-labelledby="psych-stages-heading"
        className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-5"
      >
        <div>
          <h2
            id="psych-stages-heading"
            className="font-display text-lg sm:text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
          >
            التفسير النفسي لمراحل التعافي
          </h2>
          <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
            اختر أي مرحلة لتفهم التغير النفسي والعصبي فيها وكيف تتعامل معه بوعي
          </p>
        </div>

        {/* Interactive Stage Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {WARRIOR_PSYCH_STAGES.map((stage) => {
            const isCurrent = stage.id === activeStage.id;
            const isPassed = stage.maxDay !== null && currentDayNumber > stage.maxDay;
            const isSelected = stage.id === inspectedStage.id;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-4 rounded-xl border text-right flex flex-col justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FEF4BE]/60 border-[#C98F0A] dark:bg-[#ECC93B]/15 dark:border-[#ECC93B]'
                    : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] hover:border-[#C98F0A]/60 dark:hover:border-[#ECC93B]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-mono-num text-xs font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                    {stage.dayRange}
                  </span>
                  {isPassed ? (
                    <Check
                      className="w-4 h-4 text-[#2F6E1B] dark:text-[#65C449] shrink-0"
                      aria-label="مرحلة مكتملة"
                    />
                  ) : isCurrent ? (
                    <span className="text-[11px] font-medium text-[#2F6E1B] dark:text-[#65C449]">
                      الآن
                    </span>
                  ) : null}
                </div>
                <div className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9] leading-snug">
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Psychological Card for Selected Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
          <div className="lg:col-span-7 p-4 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] space-y-1.5">
            <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B]">
              المرحلة {inspectedStage.stageNumber} · {inspectedStage.dayRange} — ما يحدث نفسياً وعصبياً
            </div>
            <h3 className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              {inspectedStage.title}
            </h3>
            <p className="text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
              {inspectedStage.psychExplanation}
            </p>
          </div>

          <div className="lg:col-span-5 p-4 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] flex flex-col justify-center space-y-1.5">
            <div className="text-xs font-medium text-[#2F6E1B] dark:text-[#65C449]">
              قاعدة المحارب في هذه المرحلة
            </div>
            <p className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed">
              {inspectedStage.warriorRule}
            </p>
          </div>
        </div>
      </section>

      {/* Bottom 2-Column Split: Daily Advice Library + Short Psychological Q&A */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Daily Tips with Interactive Category Filter (7 cols) */}
        <section
          aria-labelledby="daily-tips-heading"
          className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="daily-tips-heading"
                className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                نصائح يومية لحماية صمودك
              </h2>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                إرشادات مختصرة وقابلة للتطبيق حسب توقيت يومك
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="تصفية النصائح اليومية"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]"
          >
            {TIP_FILTERS.map((filter) => {
              const active = tipFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTipFilter(filter.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                      : 'text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
            {filteredTips.map((tip) => (
              <article key={tip.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#9A6B06] dark:text-[#ECC93B] font-medium">
                  <span>{tip.categoryLabel}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                  {tip.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
                  {tip.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Short Psychological Explanations Accordion (5 cols) */}
        <section
          aria-labelledby="psych-faq-heading"
          className="lg:col-span-5 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-4"
        >
          <div>
            <h2
              id="psych-faq-heading"
              className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              تفسيرات نفسية سريعة
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
              فهم سلوك عقلك يقلل القلق ويضاعف قدرتك على الثبات
            </p>
          </div>

          <div className="space-y-2.5">
            {WARRIOR_PSYCH_NOTES.map((note) => {
              const isOpen = openNoteId === note.id;
              return (
                <div
                  key={note.id}
                  className="rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenNoteId(isOpen ? null : note.id)}
                    className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-right cursor-pointer"
                  >
                    <span className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] leading-snug">
                      {note.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#556442] dark:text-[#A2B193] shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
                      {note.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
