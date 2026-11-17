import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DIGITAL_SAFEGUARDS } from '../data/recoveryContent';
import { getLocalDateKey } from '../hooks/useRecoveryStore';
import { RecoveryState } from '../types/recovery';

interface HabitsShieldViewProps {
  state: RecoveryState;
  onToggleHabitToday: (habitId: string) => void;
  onAddHabit: (title: string, category: string) => void;
  onRemoveHabit: (habitId: string) => void;
  onToggleSafeguard: (safeguardId: string) => void;
}

export function HabitsShieldView({
  state,
  onToggleHabitToday,
  onAddHabit,
  onRemoveHabit,
  onToggleSafeguard,
}: HabitsShieldViewProps) {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('');
  const [expandedSafeguard, setExpandedSafeguard] = useState<string | null>(
    DIGITAL_SAFEGUARDS[0].id
  );

  const todayKey = getLocalDateKey();
  const completedToday = state.checkIns[todayKey]?.completedHabitIds ?? [];
  const habitPct =
    state.habits.length > 0
      ? Math.round((completedToday.length / state.habits.length) * 100)
      : 0;

  const safeguardPct = Math.round(
    (state.completedSafeguards.length / DIGITAL_SAFEGUARDS.length) * 100
  );

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle, newHabitCategory);
    setNewHabitTitle('');
    setNewHabitCategory('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section
        aria-labelledby="habits-heading"
        className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              id="habits-heading"
              className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              العادات البديلة اليومية
            </h1>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              استبدال العادة السلبية بعادات تمنح الدماغ دوبامين طبيعي مستقر
            </p>
          </div>
          <span className="font-mono-num text-sm font-semibold text-[#9A6B06] dark:text-[#ECC93B] shrink-0">
            {completedToday.length} / {state.habits.length}
          </span>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B] transition-[width] duration-300"
            style={{ width: `${habitPct}%` }}
          />
        </div>

        <div className="mt-5 divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
          {state.habits.map((habit) => {
            const done = completedToday.includes(habit.id);
            return (
              <div key={habit.id} className="py-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleHabitToday(habit.id)}
                  className="flex items-center gap-3 text-right flex-1 min-w-0 min-h-[44px] cursor-pointer"
                >
                  <span
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      done
                        ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                        : 'border-[#BECA9E] dark:border-[#3C5031]'
                    }`}
                  >
                    {done && <Check className="w-4 h-4" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        done
                          ? 'line-through text-[#556442] dark:text-[#A2B193]'
                          : 'text-[#1C2912] dark:text-[#F3F6E9]'
                      }`}
                    >
                      {habit.title}
                    </div>
                    <div className="text-xs text-[#556442] dark:text-[#A2B193]">
                      {habit.category}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveHabit(habit.id)}
                  aria-label={`حذف عادة ${habit.title}`}
                  className="p-2 text-[#556442] hover:text-[#DC2626] dark:text-[#A2B193] dark:hover:text-[#F87171] shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleAddHabit}
          className="mt-5 pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-2.5"
        >
          <div className="text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9]">
            إضافة عادة بديلة جديدة
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="مثال: دش بارد صباحاً أو حفظ صفحة..."
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
            />
            <input
              type="text"
              value={newHabitCategory}
              onChange={(e) => setNewHabitCategory(e.target.value)}
              placeholder="التصنيف (اختياري)"
              className="sm:w-36 min-h-[44px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>إضافة</span>
            </button>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="shield-heading"
        className="lg:col-span-6 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="shield-heading"
              className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              درع حماية البيئة الرقمية
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              تقليل الاحتكاك والوصول السهل للمحتوى المثير أقوى من الاعتماد على قوة الإرادة وحدها
            </p>
          </div>
          <span className="font-mono-num text-sm font-semibold text-[#2F6E1B] dark:text-[#65C449] shrink-0">
            {safeguardPct}%
          </span>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2F6E1B] dark:bg-[#65C449] transition-[width] duration-300"
            style={{ width: `${safeguardPct}%` }}
          />
        </div>

        <div className="mt-5 divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
          {DIGITAL_SAFEGUARDS.map((item) => {
            const done = state.completedSafeguards.includes(item.id);
            const isExpanded = expandedSafeguard === item.id;

            return (
              <div key={item.id} className="py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleSafeguard(item.id)}
                    className="flex items-start gap-3 text-right flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? 'bg-[#2F6E1B] border-[#2F6E1B] text-white dark:bg-[#65C449] dark:border-[#65C449] dark:text-[#11180E]'
                          : 'border-[#BECA9E] dark:border-[#3C5031]'
                      }`}
                    >
                      {done && <Check className="w-4 h-4" aria-hidden="true" />}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9]">
                        {item.title}
                      </div>
                      <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                        {item.summary}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSafeguard(isExpanded ? null : item.id)
                    }
                    aria-expanded={isExpanded}
                    aria-label="عرض خطوات التطبيق"
                    className="p-2 text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] shrink-0 cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-150 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {isExpanded && (
                  <ol className="mt-3 mr-9 space-y-1.5 text-xs text-[#556442] dark:text-[#A2B193] list-decimal list-inside leading-relaxed">
                    {item.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
