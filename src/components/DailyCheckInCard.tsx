import { ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DailyCheckIn, NavTab } from '../types/recovery';

interface DailyCheckInCardProps {
  todayKey: string;
  todayCheckIn?: DailyCheckIn;
  onSaveCheckIn: (payload: {
    mood: number;
    urgeLevel: number;
    note: string;
    tags: string[];
  }) => void;
  onNavigate: (tab: NavTab) => void;
}

const MOOD_LEVELS = [
  { value: 1, label: 'مثقل' },
  { value: 2, label: 'متعب' },
  { value: 3, label: 'متوازن' },
  { value: 4, label: 'جيد' },
  { value: 5, label: 'مطمئن' },
];

const URGE_LEVELS = [
  { value: 1, label: 'منعدمة' },
  { value: 2, label: 'خفيفة' },
  { value: 3, label: 'متوسطة' },
  { value: 4, label: 'قوية' },
  { value: 5, label: 'حادّة' },
];

const QUICK_TAGS = [
  'صفاء ذهني',
  'طاعة وذكر',
  'رياضة أو حركة',
  'ضغط وتوتر',
  'ملل وفراغ',
  'سهر متأخر',
  'عزلة',
  'تشتّت بالهاتف',
];

export function DailyCheckInCard({
  todayKey,
  todayCheckIn,
  onSaveCheckIn,
  onNavigate,
}: DailyCheckInCardProps) {
  const isAlreadyCheckedInToday = Boolean(todayCheckIn?.checkedInAt);

  const [mood, setMood] = useState<number>(todayCheckIn?.mood ?? 4);
  const [urgeLevel, setUrgeLevel] = useState<number>(todayCheckIn?.urgeLevel ?? 2);
  const [dailyNote, setDailyNote] = useState<string>(todayCheckIn?.note ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(todayCheckIn?.tags ?? []);

  useEffect(() => {
    setMood(todayCheckIn?.mood ?? 4);
    setUrgeLevel(todayCheckIn?.urgeLevel ?? 2);
    setDailyNote(todayCheckIn?.note ?? '');
    setSelectedTags(todayCheckIn?.tags ?? []);
  }, [todayKey, todayCheckIn]);

  if (isAlreadyCheckedInToday) {
    return null;
  }

  const activeMoodInfo = MOOD_LEVELS.find((m) => m.value === mood) ?? MOOD_LEVELS[3];
  const activeUrgeInfo = URGE_LEVELS.find((u) => u.value === urgeLevel) ?? URGE_LEVELS[1];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCheckIn({
      mood,
      urgeLevel,
      note: dailyNote,
      tags: selectedTags,
    });
  };

  return (
    <section
      aria-labelledby="checkin-heading"
      className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between"
    >
      <div>
        <h2
          id="checkin-heading"
          className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
        >
          تقييم اليوم السريع
        </h2>
        <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
          سجّل حالتك في ثوانٍ لمتابعة مؤشرات تعافيك
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Mood 1-5 with clear labels */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#1C2912] dark:text-[#F3F6E9]">المزاج</span>
              <span className="font-medium text-[#9A6B06] dark:text-[#ECC93B] tabular-nums">
                {activeMoodInfo.label} ({mood} / ٥)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {MOOD_LEVELS.map((item) => {
                const selected = mood === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMood(item.value)}
                    className={`min-h-[48px] px-1 py-1.5 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      selected
                        ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] hover:border-[#C98F0A]/60'
                    }`}
                  >
                    <span className="font-mono-num text-xs font-bold leading-none">
                      {item.value}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urge Level 1-5 with semantic color cue */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#1C2912] dark:text-[#F3F6E9]">شدة الرغبة</span>
              <span
                className={`font-medium tabular-nums ${
                  urgeLevel >= 4
                    ? 'text-[#DC2626] dark:text-[#F87171]'
                    : urgeLevel === 3
                    ? 'text-[#9A6B06] dark:text-[#ECC93B]'
                    : 'text-[#2F6E1B] dark:text-[#65C449]'
                }`}
              >
                {activeUrgeInfo.label} ({urgeLevel} / ٥)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {URGE_LEVELS.map((item) => {
                const selected = urgeLevel === item.value;
                let selectedClasses =
                  'bg-[#2F6318] border-[#2F6318] text-white dark:bg-[#65C449] dark:border-[#65C449] dark:text-[#11180E]';
                if (item.value === 3) {
                  selectedClasses =
                    'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]';
                } else if (item.value >= 4) {
                  selectedClasses =
                    'bg-[#DC2626] border-[#DC2626] text-white dark:bg-[#EF4444] dark:border-[#EF4444] dark:text-white';
                }

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setUrgeLevel(item.value)}
                    className={`min-h-[48px] px-1 py-1.5 rounded-xl border transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      selected
                        ? selectedClasses
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] hover:border-[#2F6318]/50'
                    }`}
                  >
                    <span className="font-mono-num text-xs font-bold leading-none">
                      {item.value}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-tap situation tags */}
          <div>
            <div className="text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] mb-1.5">
              أبرز ما مررت به (اختياري)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2F6318] border-[#2F6318] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short daily note */}
          <div>
            <label htmlFor="daily-note-input" className="sr-only">
              ملاحظة مختصرة لليوم
            </label>
            <textarea
              id="daily-note-input"
              rows={2}
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              placeholder="سطر مختصر عن يومك أو درس تعلمته..."
              className="w-full p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] placeholder:text-[#556442] focus:outline-2 focus:outline-[#C98F0A]"
            />
          </div>

          {/* Instant SOS guidance if urge is high even before saving */}
          {urgeLevel >= 4 && (
            <div className="rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 p-3 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                رغبتك مرتفعة — هل تريد تفعيل خطة الطوارئ الآن؟
              </span>
              <button
                type="button"
                onClick={() => onNavigate('sos')}
                className="min-h-[34px] px-3 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                <span>طوارئ الآن</span>
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[42px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            حفظ تقييم اليوم
          </button>
        </form>
    </section>
  );
}
