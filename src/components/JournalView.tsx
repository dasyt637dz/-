import { Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  COMMON_TRIGGERS,
  TIME_OF_DAY_OPTIONS,
  WEAKNESS_PLANS,
} from '../data/recoveryContent';
import { JournalEntry, LogEntryType, TimeOfDay } from '../types/recovery';

interface JournalViewProps {
  journal: JournalEntry[];
  onAddEntry: (payload: {
    type: LogEntryType;
    triggers: string[];
    timeOfDay: TimeOfDay;
    intensity: number;
    notes: string;
    actionTaken?: string;
    resetStreak?: boolean;
  }) => void;
  onDeleteEntry: (id: string) => void;
}

export function JournalView({ journal, onAddEntry, onDeleteEntry }: JournalViewProps) {
  const [entryType, setEntryType] = useState<LogEntryType>('victory');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [intensity, setIntensity] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [resetStreak, setResetStreak] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const [filterType, setFilterType] = useState<'all' | LogEntryType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const instantSuggestedSolutions = useMemo(() => {
    if (selectedTriggers.length === 0) return [];
    const primaryTrigger = selectedTriggers[selectedTriggers.length - 1];
    const matchedPlan =
      WEAKNESS_PLANS.find((plan) => plan.triggerMatch === primaryTrigger) ??
      WEAKNESS_PLANS.find((plan) => plan.label === primaryTrigger);
    if (!matchedPlan) return [];
    return matchedPlan.solutions.slice(0, 2).map((sol) => ({
      planLabel: matchedPlan.label,
      ...sol,
    }));
  }, [selectedTriggers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({
      type: entryType,
      triggers: selectedTriggers.length > 0 ? selectedTriggers : ['غير محدد'],
      timeOfDay,
      intensity,
      notes,
      resetStreak: entryType === 'relapse' ? resetStreak : false,
    });
    setSelectedTriggers([]);
    setNotes('');
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const triggerStats = useMemo(() => {
    const counts: Record<string, number> = {};
    journal.forEach((entry) => {
      entry.triggers.forEach((t) => {
        if (t !== 'غير محدد') {
          counts[t] = (counts[t] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxCount = sorted[0]?.[1] || 1;
    return { sorted, maxCount };
  }, [journal]);

  const timeStats = useMemo(() => {
    const counts: Record<TimeOfDay, number> = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };
    journal.forEach((entry) => {
      counts[entry.timeOfDay] = (counts[entry.timeOfDay] || 0) + 1;
    });
    return TIME_OF_DAY_OPTIONS.map((opt) => ({
      ...opt,
      count: counts[opt.value],
    }));
  }, [journal]);

  const filteredJournal = useMemo(() => {
    return journal.filter((entry) => {
      if (filterType !== 'all' && entry.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inNotes = entry.notes.toLowerCase().includes(q);
        const inTriggers = entry.triggers.some((t) => t.toLowerCase().includes(q));
        return inNotes || inTriggers;
      }
      return true;
    });
  }, [journal, filterType, searchQuery]);

  const getTimeLabel = (val: TimeOfDay) =>
    TIME_OF_DAY_OPTIONS.find((t) => t.value === val)?.label ?? val;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section
          aria-labelledby="log-form-heading"
          className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
        >
          <h1
            id="log-form-heading"
            className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
          >
            اللحظات الصعبة وتحليل المحفزات
          </h1>
          <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
            اختر ما أشعل اللحظة ليقترح لك التطبيق حلولاً فورية مجربة في نفس الوقت
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]">
              <button
                type="button"
                onClick={() => setEntryType('victory')}
                className={`min-h-[42px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  entryType === 'victory'
                    ? 'bg-[#FCFDF7] dark:bg-[#192315] text-[#2F6E1B] dark:text-[#65C449] shadow-xs'
                    : 'text-[#556442] dark:text-[#A2B193]'
                }`}
              >
                تجاوزت اللحظة الصعبة
              </button>
              <button
                type="button"
                onClick={() => setEntryType('relapse')}
                className={`min-h-[42px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  entryType === 'relapse'
                    ? 'bg-[#FCFDF7] dark:bg-[#192315] text-[#DC2626] dark:text-[#FCA5A5] shadow-xs'
                    : 'text-[#556442] dark:text-[#A2B193]'
                }`}
              >
                تسجيل عودة وإعادة الضبط
              </button>
            </div>

            {entryType === 'relapse' && (
              <div className="p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-sm text-[#B91C1C] dark:text-[#FCA5A5] space-y-2.5">
                <p className="leading-relaxed">
                  العثرة ليست نهاية الطريق. المهم هو فهم المحفز وإغلاق الثغرة فوراً.
                </p>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetStreak}
                    onChange={(e) => setResetStreak(e.target.checked)}
                    className="w-4 h-4 accent-[#DC2626]"
                  />
                  <span className="text-xs font-medium">
                    تصفير العداد الحالي والبدء من جديد الآن (يُحفظ رقمك القياسي السابق)
                  </span>
                </label>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] mb-2">
                ما الذي أشعل هذه اللحظة؟
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_TRIGGERS.map((trigger) => {
                  const active = selectedTriggers.includes(trigger);
                  return (
                    <button
                      key={trigger}
                      type="button"
                      onClick={() => toggleTrigger(trigger)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                      }`}
                    >
                      {trigger}
                    </button>
                  );
                })}
              </div>
            </div>

            {instantSuggestedSolutions.length > 0 && (
              <div className="p-4 rounded-xl bg-[#C98F0A]/8 dark:bg-[#ECC93B]/10 border border-[#C98F0A]/30 dark:border-[#ECC93B]/30 space-y-2.5">
                <div className="text-xs font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                  حلان مقترحان الآن لسبب «{instantSuggestedSolutions[0].planLabel}»
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {instantSuggestedSolutions.map((sol) => (
                    <div
                      key={sol.title}
                      className="p-3 rounded-lg bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24]"
                    >
                      <div className="text-xs font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                        {sol.title}
                      </div>
                      <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1 leading-relaxed">
                        {sol.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] mb-2">
                  وقت الحدوث
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OF_DAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimeOfDay(opt.value)}
                      className={`min-h-[40px] px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        timeOfDay === opt.value
                          ? 'bg-[#2F6318] border-[#2F6318] text-white dark:bg-[#F3F6E9] dark:border-[#F3F6E9] dark:text-[#11180E]'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] mb-2">
                  <span>قوة الرغبة</span>
                  <span className="text-xs text-[#556442] dark:text-[#A2B193] tabular-nums">
                    {intensity} / ٥
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`min-h-[40px] rounded-lg text-sm font-medium tabular-nums border transition-colors cursor-pointer ${
                        intensity === lvl
                          ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                          : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="journal-notes"
                className="block text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] mb-1.5"
              >
                {entryType === 'victory'
                  ? 'ما الذي فعلته لتجاوزها؟'
                  : 'ما الدرس المستفاد؟ وما الإجراء الوقائي للمرة القادمة؟'}
              </label>
              <textarea
                id="journal-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اكتب بصدق ووضوح لنفسك..."
                className="w-full p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-medium transition-colors cursor-pointer"
            >
              {savedNotice ? 'تم حفظ السجل بنجاح' : 'حفظ في السجل الشخصي'}
            </button>
          </form>
        </section>

        <section
          aria-labelledby="insights-heading"
          className="lg:col-span-5 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-6"
        >
          <div>
            <h2
              id="insights-heading"
              className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              تحليل أنماطك المتكررة
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              يُبنى تلقائياً من المواقف التي تسجلها لاكتشاف أوقات الخطر
            </p>
          </div>

          {journal.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#D5DEC0] dark:border-[#2C3B24] rounded-xl px-4">
              <p className="text-sm text-[#556442] dark:text-[#A2B193]">
                سجّل أول لحظة صعبة أو انتصار ليبدأ تحليل محفزاتك وأوقات ضعفك تلقائياً.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">
                  أكثر المحفزات تكراراً
                </h3>
                {triggerStats.sorted.length > 0 ? (
                  <div className="space-y-2.5">
                    {triggerStats.sorted.map(([trigger, count]) => (
                      <div key={trigger} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#1C2912] dark:text-[#F3F6E9]">{trigger}</span>
                          <span className="text-[#556442] dark:text-[#A2B193] tabular-nums">
                            {count} مرة
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B]"
                            style={{ width: `${Math.round((count / triggerStats.maxCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#556442] dark:text-[#A2B193]">
                    لا توجد محفزات محددة بعد.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3">
                <h3 className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">
                  توزيع المواقف حسب الوقت
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {timeStats.map((slot) => (
                    <div
                      key={slot.value}
                      className="p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] flex items-center justify-between"
                    >
                      <span className="text-xs text-[#556442] dark:text-[#A2B193]">{slot.label}</span>
                      <span className="font-mono-num text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                        {slot.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section
        aria-labelledby="history-heading"
        className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2
            id="history-heading"
            className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
          >
            سجل المواقف السابق ({filteredJournal.length})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'victory', label: 'الانتصارات' },
                { id: 'relapse', label: 'العودات' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as 'all' | LogEntryType)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-[#FCFDF7] dark:bg-[#192315] text-[#1C2912] dark:text-[#F3F6E9] shadow-xs'
                      : 'text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#556442] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الملاحظات..."
                className="min-h-[38px] pr-9 pl-3 rounded-lg bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
              />
            </div>
          </div>
        </div>

        {filteredJournal.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#556442] dark:text-[#A2B193]">
            لا توجد سجلات مطابقة للعرض حالياً.
          </div>
        ) : (
          <div className="divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
            {filteredJournal.map((entry) => {
              const dateStr = new Date(entry.createdAt).toLocaleDateString('ar-EG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const isVictory = entry.type === 'victory';

              return (
                <article key={entry.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#556442] dark:text-[#A2B193]">
                      <span
                        className={`font-semibold ${
                          isVictory
                            ? 'text-[#2F6E1B] dark:text-[#65C449]'
                            : 'text-[#DC2626] dark:text-[#FCA5A5]'
                        }`}
                      >
                        {isVictory ? 'انتصار على رغبة' : 'عودة وإعادة ضبط'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{dateStr}</span>
                      <span aria-hidden="true">·</span>
                      <span>{getTimeLabel(entry.timeOfDay)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">الشدة: {entry.intensity}/٥</span>
                    </div>

                    <div className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">
                      المحفزات: {entry.triggers.join('، ')}
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-[#556442] dark:text-[#A2B193] leading-relaxed">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    aria-label="حذف السجل"
                    className="p-2 text-[#556442] hover:text-[#DC2626] dark:text-[#A2B193] dark:hover:text-[#F87171] shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
