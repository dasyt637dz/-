import {
  Check,
  Compass,
  HandHeart,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Vibrate,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FEATURED_RECOVERY_QUOTE, URGE_INTERRUPT_ACTIONS } from '../data/recoveryContent';

interface UrgeSOSViewProps {
  personalReasons: string[];
  onWaveSurvived: (triggerLabel?: string) => void;
}

type BreathMode = 'box' | 'calm478';
type BreathPhaseKey = 'inhale' | 'hold1' | 'exhale' | 'hold2';
type ToolkitTab = 'actions' | 'grounding' | 'dhikr';

interface BreathPhaseStep {
  key: BreathPhaseKey;
  label: string;
  hint: string;
  seconds: number;
}

const BREATH_MODES: Record<
  BreathMode,
  {
    title: string;
    subtitle: string;
    steps: BreathPhaseStep[];
  }
> = {
  box: {
    title: 'التنفس المربع (٤-٤-٤-٤)',
    subtitle: 'يخفض استجابة التوتر العصبي ويعيد تنشيط قشرة اتخاذ القرار',
    steps: [
      { key: 'inhale', label: 'شهيق عميق', hint: 'املأ رئتيك ببطء عبر الأنف', seconds: 4 },
      { key: 'hold1', label: 'احبس النفس', hint: 'حافظ على الهدوء والثبات', seconds: 4 },
      { key: 'exhale', label: 'زفير بطيء', hint: 'أخرج الهواء تدريجياً وأرخِ كتفيك', seconds: 4 },
      { key: 'hold2', label: 'سكون', hint: 'استرح قبل الدورة التالية', seconds: 4 },
    ],
  },
  calm478: {
    title: 'تهدئة سريعة (٤-٧-٨)',
    subtitle: 'إيقاع طبيعي لتهدئة تسارع النبض والرغبة الحادة خلال دقيقتين',
    steps: [
      { key: 'inhale', label: 'شهيق هادئ', hint: 'تنفس بعمق من الأنف ٤ ثوانٍ', seconds: 4 },
      { key: 'hold1', label: 'ثبات النفس', hint: 'اشعر بهدوء صدرك ٧ ثوانٍ', seconds: 7 },
      { key: 'exhale', label: 'زفير طويل', hint: 'أخرج الهواء ببطء كامل ٨ ثوانٍ', seconds: 8 },
    ],
  },
};

const QUICK_TRIGGERS: { id: string; label: string; counterMove: string }[] = [
  {
    id: 'boredom',
    label: 'ملل أو فراغ',
    counterMove:
      'انهض فوراً من مكانك واشغل يديك بحركة بدنية أو مهمة واضحة لمدة ٥ دقائق — الفراغ هو الوقود الوحيد للرغبة.',
  },
  {
    id: 'late_night',
    label: 'سهر وعزلة',
    counterMove:
      'أغلق الشاشة الآن، ضع الهاتف في غرفة أخرى بعيداً عن السرير، وتوضّأ أو استلقِ للنوم فوراً.',
  },
  {
    id: 'stress',
    label: 'توتر أو ضغط',
    counterMove:
      'أنت تبحث عن راحة لأعصابك لا أكثر؛ شغّل تنفس التهدئة (٤-٧-٨) لمدة دقيقتين واغسل وجهك بماء بارد.',
  },
  {
    id: 'phone',
    label: 'مشتتات الهاتف',
    counterMove:
      'أغلق التطبيق المثير فوراً وضع الهاتف مقلوباً خارج الغرفة لـ ١٠ دقائق حتى تنكسر حلقة الدوبامين.',
  },
  {
    id: 'sadness',
    label: 'ثقل نفسي أو حزن',
    counterMove:
      'الاستسلام سيضاعف الضيق بعد دقيقتين؛ توضّأ، صلِّ على النبي ﷺ، واخرج للمشي أو الجلوس مع غيرك.',
  },
];

const GROUNDING_STEPS: { id: string; count: string; title: string; detail: string }[] = [
  {
    id: 'g5',
    count: '٥',
    title: 'خمسة أشياء تراها بعينيك الآن',
    detail: 'سمِّ بصوت خافت ٥ أشياء مادية في الغرفة (باب، كتاب، مصباح، نافذة، ساعة).',
  },
  {
    id: 'g4',
    count: '٤',
    title: 'أربعة أشياء تلمسها بيديك',
    detail: 'اشعر بملمس ملابسك، برودة الحائط أو الطاولة، ثبات قدميك على الأرض.',
  },
  {
    id: 'g3',
    count: '٣',
    title: 'ثلاثة أصوات تسمعها حولك',
    detail: 'أنصت لهدوء الغرفة، صوت الهواء، أو أي حركة بعيدة خارج النافذة.',
  },
  {
    id: 'g2',
    count: '٢',
    title: 'شيئان تشمّهما أو نفس عميق نقي',
    detail: 'استنشق هواءً نقياً من نافذة أو اشعر بانتعاش الماء البارد على وجهك.',
  },
  {
    id: 'g1',
    count: '١',
    title: 'ذكر واحد تردّده بلسانك بيقين',
    detail: 'ردّد بلسانك: «حسبي الله لا إله إلا هو عليه توكلت، اللهم أعنّي وثبّت قلبي».',
  },
];

const STEADFAST_ADHKAAR = [
  {
    title: 'دعاء الثبات والاستعانة',
    text: 'اللهم أعنّي على ذكرك وشكرك وحسن عبادتك، واصرف عني السوء والفحشاء.',
  },
  {
    title: 'الاستغفار والصلاة على النبي ﷺ',
    text: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه · اللهم صلِّ وسلم على نبينا محمد.',
  },
  {
    title: 'التفويض والتوكل عند الشدة',
    text: 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.',
  },
];

const DELAY_PRESETS = [
  { seconds: 180, label: '٣ دقائق' },
  { seconds: 300, label: '٥ دقائق' },
  { seconds: 600, label: '١٠ دقائق' },
  { seconds: 900, label: '١٥ دقيقة' },
];

export function UrgeSOSView({
  personalReasons,
  onWaveSurvived,
}: UrgeSOSViewProps) {
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);

  const [breathMode, setBreathMode] = useState<BreathMode>('box');
  const [breathingActive, setBreathingActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [breathCycles, setBreathCycles] = useState(0);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const [delayPresetSeconds, setDelayPresetSeconds] = useState(600);
  const [delayRunning, setDelayRunning] = useState(true);
  const [delaySecondsLeft, setDelaySecondsLeft] = useState(600);

  const [toolkitTab, setToolkitTab] = useState<ToolkitTab>('actions');
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [completedGrounding, setCompletedGrounding] = useState<string[]>([]);
  const [dhikrCount, setDhikrCount] = useState(0);

  const [survivedLogged, setSurvivedLogged] = useState(false);

  const activeBreathConfig = BREATH_MODES[breathMode];
  const currentPhase =
    activeBreathConfig.steps[phaseIndex % activeBreathConfig.steps.length];

  const selectedTrigger = QUICK_TRIGGERS.find((t) => t.id === selectedTriggerId) ?? null;

  useEffect(() => {
    if (!breathingActive) return;
    const steps = BREATH_MODES[breathMode].steps;
    const interval = window.setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextIdx = (phaseIndex + 1) % steps.length;
        if (nextIdx === 0) {
          setBreathCycles((c) => c + 1);
        }
        if (hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(25);
          } catch {
            // Ignore vibration errors
          }
        }
        setPhaseIndex(nextIdx);
        return steps[nextIdx].seconds;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [breathingActive, breathMode, phaseIndex, hapticEnabled]);

  useEffect(() => {
    if (!delayRunning) return;
    const interval = window.setInterval(() => {
      setDelaySecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [delayRunning]);

  const handleChangeBreathMode = (mode: BreathMode) => {
    setBreathMode(mode);
    setBreathingActive(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(BREATH_MODES[mode].steps[0].seconds);
  };

  const handleResetBreathing = () => {
    setBreathingActive(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(activeBreathConfig.steps[0].seconds);
    setBreathCycles(0);
  };

  const handleSelectDelayPreset = (seconds: number) => {
    setDelayPresetSeconds(seconds);
    setDelaySecondsLeft(seconds);
    setDelayRunning(true);
  };

  const circleScale =
    !breathingActive
      ? 1
      : currentPhase.key === 'inhale' || currentPhase.key === 'hold1'
      ? 1.24
      : 0.88;

  const delayMins = Math.floor(delaySecondsLeft / 60);
  const delaySecs = delaySecondsLeft % 60;
  const delayProgressPct = Math.round(
    ((delayPresetSeconds - delaySecondsLeft) / Math.max(1, delayPresetSeconds)) * 100
  );

  const toggleAction = (id: string) => {
    setCompletedActions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGrounding = (id: string) => {
    setCompletedGrounding((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSurvived = () => {
    onWaveSurvived(selectedTrigger?.label);
    setSurvivedLogged(true);
    window.setTimeout(() => setSurvivedLogged(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* BAND 1: Calm Rescue Header + Quick Trigger Diagnosis */}
      <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C98F0A] dark:text-[#ECC93B] mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>حالة طوارئ</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9] text-balance">
              تنفس بهدوء — هذه الرغبة موجة مؤقتة وستمر
            </h1>
            <p className="text-sm sm:text-base text-[#556442] dark:text-[#A2B193] mt-2 leading-relaxed">
              ذروة الرغبة القهرية تستمر غالباً دقائق معدودة ثم تتلاشى تلقائياً. لا تقرر في لحظة
              الاندفاع؛ شغّل خطوة واحدة فقط من الأدوات أدناه.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSurvived}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{survivedLogged ? 'تم تسجيل انتصارك الآن' : 'انتهت الموجة بنجاح'}</span>
            </button>
          </div>
        </div>

        {survivedLogged && (
          <div className="rounded-xl bg-[#EEF3DF] dark:bg-[#26351F] border border-[#2F6E1B]/30 px-4 py-3 text-xs sm:text-sm font-medium text-[#2F6E1B] dark:text-[#65C449]">
            أحسنت! تم تسجيل انتصار جديد في سجلك. كل موجة تتجاوزها تضعف الحلقة السابقة وتزيد ثباتك.
          </div>
        )}

        {/* Quick 1-Tap Trigger Diagnosis */}
        <div className="pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] space-y-3">
          <div className="text-xs font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
            ما الذي أشعل الرغبة الآن؟ (اختر لتأخذ الخطوة الأنسب فوراً)
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TRIGGERS.map((item) => {
              const active = selectedTriggerId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelectedTriggerId((prev) => (prev === item.id ? null : item.id))
                  }
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                      : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {selectedTrigger && (
            <div className="rounded-xl bg-[#FEF4BE]/55 dark:bg-[#26351F] border border-[#D9A714]/50 dark:border-[#ECC93B]/40 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed">
              <Sparkles
                className="w-4 h-4 text-[#9A6B06] dark:text-[#ECC93B] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <span className="font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                  خطة الإنقاذ لـ «{selectedTrigger.label}»:
                </span>{' '}
                {selectedTrigger.counterMove}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BAND 2: Guided Breathing (Dual Modes) + Flexible Delay Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-labelledby="breathing-heading"
          className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="breathing-heading"
                  className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
                >
                  {activeBreathConfig.title}
                </h2>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                  {activeBreathConfig.subtitle}
                </p>
              </div>
              <span className="text-xs text-[#556442] dark:text-[#A2B193] tabular-nums">
                الدورات المكتملة: {breathCycles}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex gap-1 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]">
                <button
                  type="button"
                  onClick={() => handleChangeBreathMode('box')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    breathMode === 'box'
                      ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                      : 'text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  مربع ٤-٤-٤-٤
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeBreathMode('calm478')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    breathMode === 'calm478'
                      ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                      : 'text-[#556442] dark:text-[#A2B193]'
                  }`}
                >
                  تهدئة ٤-٧-٨
                </button>
              </div>

              <button
                type="button"
                onClick={() => setHapticEnabled((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                  hapticEnabled
                    ? 'bg-[#EEF3DF] dark:bg-[#26351F] border-[#2F6E1B]/30 text-[#2F6E1B] dark:text-[#65C449]'
                    : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                }`}
              >
                <Vibrate className="w-3.5 h-3.5" aria-hidden="true" />
                <span>نبض الإيقاع</span>
              </button>
            </div>
          </div>

          <div className="my-7 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div
                className="absolute inset-2 rounded-full bg-[#2F6318]/10 dark:bg-[#65C449]/10 transition-transform duration-1000 ease-in-out"
                style={{ transform: `scale(${circleScale * 1.08})` }}
              />
              <div
                className="absolute inset-5 rounded-full bg-[#C98F0A]/15 dark:bg-[#ECC93B]/20 border border-[#C98F0A]/45 dark:border-[#ECC93B]/45 transition-transform duration-1000 ease-in-out"
                style={{ transform: `scale(${circleScale})` }}
              />
              <div className="relative z-10 text-center">
                <div className="font-mono-num text-3xl font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                  {breathingActive ? phaseSecondsLeft : activeBreathConfig.steps[0].seconds}
                </div>
                <div className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9] mt-1">
                  {breathingActive ? currentPhase.label : 'جاهز للبدء'}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-4 text-center">
              {breathingActive ? currentPhase.hint : 'اضغط ابدأ واتبع الإيقاع لمدة دقيقتين'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setBreathingActive((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2F6318] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              {breathingActive ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>ابدأ التنفس</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleResetBreathing}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>إعادة</span>
            </button>
          </div>
        </section>

        <section
          aria-labelledby="delay-heading"
          className="lg:col-span-5 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <h2
              id="delay-heading"
              className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              قاعدة التأجيل الذكية
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              اعقد اتفاقاً مع نفسك: لا تتخذ أي قرار قبل انتهاء هذا المؤقت
            </p>

            {/* Delay Presets */}
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {DELAY_PRESETS.map((preset) => {
                const active = delayPresetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => handleSelectDelayPreset(preset.seconds)}
                    className={`min-h-[34px] px-2 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="my-6 text-center">
              <div className="font-mono-num text-5xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                {String(delayMins).padStart(2, '0')}:{String(delaySecs).padStart(2, '0')}
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C98F0A] dark:bg-[#ECC93B] transition-[width] duration-300"
                  style={{ width: `${Math.max(2, delayProgressPct)}%` }}
                />
              </div>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-3 tabular-nums">
                {delaySecondsLeft === 0
                  ? 'انقضى الوقت المتفق عليه — لقد أثبتّ سيطرتك على الموجة'
                  : `تجاوزت ${delayProgressPct}% من وقت الذروة`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setDelayRunning((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9] text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              {delayRunning ? 'إيقاف المؤقت' : 'استئناف المؤقت'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDelaySecondsLeft(delayPresetSeconds);
                setDelayRunning(true);
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              إعادة
            </button>
          </div>
        </section>
      </div>

      {/* BAND 3: Interactive Rescue Toolkit + Reality Comparison & Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section
          aria-labelledby="interrupt-heading"
          className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="interrupt-heading"
                className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                حقيبة كسر الموجة الآن
              </h2>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                تنقّل بين الإجراءات الجسدية أو تمرين تأريض الحواس أو الأذكار
              </p>
            </div>
          </div>

          {/* 3 Rescue Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24]">
            {[
              {
                id: 'actions' as ToolkitTab,
                label: `إجراءات فورية (${completedActions.length}/${URGE_INTERRUPT_ACTIONS.length})`,
                icon: ShieldAlert,
              },
              {
                id: 'grounding' as ToolkitTab,
                label: `تأريض ٥-٤-٣-٢-١ (${completedGrounding.length}/5)`,
                icon: Compass,
              },
              {
                id: 'dhikr' as ToolkitTab,
                label: 'أذكار وذكر الثبات',
                icon: HandHeart,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = toolkitTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setToolkitTab(tab.id)}
                  className={`flex-1 min-w-[140px] min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#2F6318] text-white dark:bg-[#ECC93B] dark:text-[#11180E]'
                      : 'text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {toolkitTab === 'actions' && (
            <div className="divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
              {URGE_INTERRUPT_ACTIONS.map((action) => {
                const done = completedActions.includes(action.id);
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => toggleAction(action.id)}
                    className="w-full py-3.5 flex items-start gap-3.5 text-right cursor-pointer group"
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                          : 'border-[#BECA9E] dark:border-[#3C5031] group-hover:border-[#C98F0A]'
                      }`}
                    >
                      {done && <Check className="w-4 h-4" aria-hidden="true" />}
                    </span>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          done
                            ? 'line-through text-[#556442] dark:text-[#A2B193]'
                            : 'text-[#1C2912] dark:text-[#F3F6E9]'
                        }`}
                      >
                        {action.title}
                      </div>
                      <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5 leading-relaxed">
                        {action.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {toolkitTab === 'grounding' && (
            <div className="space-y-2.5">
              <p className="text-xs text-[#556442] dark:text-[#A2B193]">
                يُخرج هذا التمرين دماغك من التركيز القهري إلى الواقع المادي خلال دقيقة واحدة:
              </p>
              <div className="divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
                {GROUNDING_STEPS.map((step) => {
                  const done = completedGrounding.includes(step.id);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => toggleGrounding(step.id)}
                      className="w-full py-3 flex items-start gap-3 text-right cursor-pointer group"
                    >
                      <span
                        className={`mt-0.5 w-7 h-7 rounded-lg border font-mono-num text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-[#2F6318] border-[#2F6318] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                            : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#9A6B06] dark:text-[#ECC93B]'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" aria-hidden="true" /> : step.count}
                      </span>
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            done
                              ? 'line-through text-[#556442] dark:text-[#A2B193]'
                              : 'text-[#1C2912] dark:text-[#F3F6E9]'
                          }`}
                        >
                          {step.title}
                        </div>
                        <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {toolkitTab === 'dhikr' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                    عدّاد الذكر السريع لتفريغ التوتر
                  </div>
                  <div className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                    صلِّ على النبي ﷺ أو استغفر مع كل ضغطة
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDhikrCount((c) => c + 1)}
                    className="min-h-[42px] px-4 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold tabular-nums cursor-pointer"
                  >
                    ذكر ({dhikrCount})
                  </button>
                  {dhikrCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setDhikrCount(0)}
                      aria-label="تصفير العداد"
                      className="min-h-[42px] px-3 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs text-[#556442] dark:text-[#A2B193] cursor-pointer"
                    >
                      تصفير
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {STEADFAST_ADHKAAR.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] p-3.5"
                  >
                    <div className="text-xs font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                      {item.title}
                    </div>
                    <p className="text-sm text-[#1C2912] dark:text-[#F3F6E9] mt-1 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column (5 cols): Reality Check + Why You Started */}
        <div className="lg:col-span-5 space-y-6">
          <section
            aria-label="مقارنة الواقع"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 space-y-3"
          >
            <h2 className="font-display text-base font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              تذكّر الفارق خلال ٥ دقائق فقط
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-xs leading-relaxed">
              <div className="rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/25 p-3">
                <div className="font-semibold text-[#B91C1C] dark:text-[#FCA5A5]">
                  إن استسلمت الآن:
                </div>
                <p className="text-[#1C2912] dark:text-[#F3F6E9] mt-1">
                  لذة ثوانٍ يعقبها ثقل نفسي، وندم، وتعب ذهني يفسد بقية يومك.
                </p>
              </div>
              <div className="rounded-xl bg-[#EEF3DF] dark:bg-[#26351F] border border-[#2F6E1B]/25 p-3">
                <div className="font-semibold text-[#2F6E1B] dark:text-[#65C449]">
                  إن صمدت الآن:
                </div>
                <p className="text-[#1C2912] dark:text-[#F3F6E9] mt-1">
                  تهدأ الموجة خلال دقائق، تنام مرفوع الرأس، ويستمر عداد صمودك.
                </p>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="sos-reasons-heading"
            className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
          >
            <h2
              id="sos-reasons-heading"
              className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
            >
              تذكّر لماذا بدأت
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              رسائلك التي كتبتها لنفسك في لحظات الصفاء
            </p>

            {personalReasons.length > 0 ? (
              <ul className="mt-4 divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
                {personalReasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="py-3 text-sm text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#556442] dark:text-[#A2B193] mt-4">
                لم تضف أسباباً شخصية بعد — يمكنك إضافتها من الصفحة الرئيسية.
              </p>
            )}

            <blockquote className="mt-4 pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
              <p className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed">
                «{FEATURED_RECOVERY_QUOTE.text}»
              </p>
              {FEATURED_RECOVERY_QUOTE.author && (
                <footer className="text-xs text-[#9A6B06] dark:text-[#ECC93B] mt-1">
                  — {FEATURED_RECOVERY_QUOTE.author}
                </footer>
              )}
            </blockquote>
          </section>
        </div>
      </div>
    </div>
  );
}
