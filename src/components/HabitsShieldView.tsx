import { Check, ChevronDown, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DIGITAL_SAFEGUARDS } from '../data/recoveryContent';
import { getLocalDateKey } from '../hooks/useRecoveryStore';
import { getTranslations } from '../i18n/translations';
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
  const t = getTranslations(state.language);
  const [visibleCount, setVisibleCount] = useState(2);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showShield, setShowShield] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('');
  const [expandedSafeguard, setExpandedSafeguard] = useState<string | null>(null);

  const todayKey = getLocalDateKey();
  const completedToday = state.checkIns[todayKey]?.completedHabitIds ?? [];
  const habitPct =
    state.habits.length > 0
      ? Math.round((completedToday.length / state.habits.length) * 100)
      : 0;

  const safeguardPct = Math.round(
    (state.completedSafeguards.length / DIGITAL_SAFEGUARDS.length) * 100
  );

  const visibleHabits = state.habits.slice(0, Math.min(visibleCount, state.habits.length));
  const hasMoreHabits = visibleCount < state.habits.length;

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle, newHabitCategory);
    setNewHabitTitle('');
    setNewHabitCategory('');
    setVisibleCount((prev) => prev + 1);
    setShowAddForm(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <section
        aria-labelledby="habits-heading"
        className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              id="habits-heading"
              className="font-display text-lg sm:text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              {t.habitsTitle}
            </h1>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
              {t.habitsSub}
            </p>
          </div>
          <span className="font-mono-num text-sm font-semibold text-[#9A6B06] dark:text-[#ECC93B] shrink-0">
            {completedToday.length} / {state.habits.length}
          </span>
        </div>

        <div className="mt-3.5 h-1.5 w-full rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B] transition-[width] duration-300"
            style={{ width: `${habitPct}%` }}
          />
        </div>

        <div className="mt-4 divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
          {visibleHabits.map((habit) => {
            const done = completedToday.includes(habit.id);
            return (
              <div key={habit.id} className="py-2.5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleHabitToday(habit.id)}
                  className="flex items-center gap-3 text-start flex-1 min-w-0 min-h-[42px] cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      done
                        ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                        : 'border-[#BECA9E] dark:border-[#3C5031]'
                    }`}
                  >
                    {done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
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
                    <div className="text-[11px] text-[#556442] dark:text-[#A2B193]">
                      {habit.category}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveHabit(habit.id)}
                  aria-label={habit.title}
                  className="p-2 text-[#556442] hover:text-[#DC2626] dark:text-[#A2B193] dark:hover:text-[#F87171] shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Show Another Habit + Compact Add Toggle */}
        <div className="mt-4 pt-3.5 border-t border-[#D5DEC0] dark:border-[#2C3B24] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {hasMoreHabits && (
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((prev) => Math.min(state.habits.length, prev + 1))
                }
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.showAnotherHabit}</span>
              </button>
            )}

            {visibleCount > 2 && (
              <button
                type="button"
                onClick={() => setVisibleCount(2)}
                className="inline-flex items-center min-h-[40px] px-3 py-2 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] cursor-pointer"
              >
                {t.showFewerHabits}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.addHabitToggle}</span>
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddHabit}
            className="mt-3 pt-3 border-t border-[#D5DEC0] dark:border-[#2C3B24] flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="مثال: دش بارد صباحاً..."
              className="flex-1 min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
            />
            <input
              type="text"
              value={newHabitCategory}
              onChange={(e) => setNewHabitCategory(e.target.value)}
              placeholder="التصنيف"
              className="sm:w-32 min-h-[42px] px-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
            />
            <button
              type="submit"
              className="min-h-[42px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.addHabitBtn}
            </button>
          </form>
        )}
      </section>

      {/* Compact Collapsible Digital Protection Shield */}
      <section
        aria-labelledby="shield-heading"
        className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-5"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2F6E1B] dark:text-[#65C449] shrink-0" aria-hidden="true" />
            <div>
              <h2
                id="shield-heading"
                className="font-display text-sm sm:text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                {t.digitalShieldTitle} ·{' '}
                <span className="font-mono-num text-[#2F6E1B] dark:text-[#65C449]">
                  {safeguardPct}%
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowShield((prev) => !prev)}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] cursor-pointer"
          >
            <span>{showShield ? t.hideShieldDetails : t.showShieldDetails}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                showShield ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {showShield && (
          <div className="mt-4 pt-3 border-t border-[#D5DEC0] dark:border-[#2C3B24] divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
            {DIGITAL_SAFEGUARDS.map((item) => {
              const done = state.completedSafeguards.includes(item.id);
              const isExpanded = expandedSafeguard === item.id;

              return (
                <div key={item.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleSafeguard(item.id)}
                      className="flex items-start gap-3 text-start flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-[#2F6E1B] border-[#2F6E1B] text-white dark:bg-[#65C449] dark:border-[#65C449] dark:text-[#11180E]'
                            : 'border-[#BECA9E] dark:border-[#3C5031]'
                        }`}
                      >
                        {done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
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
                      onClick={() => setExpandedSafeguard(isExpanded ? null : item.id)}
                      aria-expanded={isExpanded}
                      className="p-1.5 text-[#556442] dark:text-[#A2B193] cursor-pointer"
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
                    <ol className="mt-2.5 ms-8 space-y-1 text-xs text-[#556442] dark:text-[#A2B193] list-decimal list-inside leading-relaxed">
                      {item.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
