import { Check, Pause, Play, RotateCcw, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FEATURED_RECOVERY_QUOTE, URGE_INTERRUPT_ACTIONS } from '../data/recoveryContent';

interface UrgeSOSViewProps {
  personalReasons: string[];
  onWaveSurvived: () => void;
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

const BREATH_PHASES: { key: BreathPhase; label: string; hint: string }[] = [
  { key: 'inhale', label: 'شهيق عميق', hint: 'املأ رئتيك ببطء عبر الأنف' },
  { key: 'hold1', label: 'احبس النفس', hint: 'حافظ على الهدوء والثبات' },
  { key: 'exhale', label: 'زفير بطيء', hint: 'أخرج الهواء تدريجياً وأرخِ كتفيك' },
  { key: 'hold2', label: 'سكون', hint: 'استرح قبل الدورة التالية' },
];

export function UrgeSOSView({ personalReasons, onWaveSurvived }: UrgeSOSViewProps) {
  const [breathingActive, setBreathingActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [breathCycles, setBreathCycles] = useState(0);

  const [delayRunning, setDelayRunning] = useState(true);
  const [delaySecondsLeft, setDelaySecondsLeft] = useState(600);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [survivedLogged, setSurvivedLogged] = useState(false);

  useEffect(() => {
    if (!breathingActive) return;
    const interval = window.setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setPhaseIndex((pIdx) => {
          const next = (pIdx + 1) % 4;
          if (next === 0) {
            setBreathCycles((c) => c + 1);
          }
          return next;
        });
        return 4;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [breathingActive]);

  useEffect(() => {
    if (!delayRunning) return;
    const interval = window.setInterval(() => {
      setDelaySecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [delayRunning]);

  const currentPhase = BREATH_PHASES[phaseIndex];
  const circleScale =
    !breathingActive
      ? 1
      : currentPhase.key === 'inhale' || currentPhase.key === 'hold1'
      ? 1.24
      : 0.9;

  const delayMins = Math.floor(delaySecondsLeft / 60);
  const delaySecs = delaySecondsLeft % 60;
  const delayProgressPct = Math.round(((600 - delaySecondsLeft) / 600) * 100);

  const toggleAction = (id: string) => {
    setCompletedActions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleResetBreathing = () => {
    setBreathingActive(false);
    setPhaseIndex(0);
    setPhaseSecondsLeft(4);
    setBreathCycles(0);
  };

  const handleSurvived = () => {
    onWaveSurvived();
    setSurvivedLogged(true);
    window.setTimeout(() => setSurvivedLogged(false), 3000);
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C2912] dark:text-[#F3F6E9] text-balance">
              تنفس بهدوء — هذه الرغبة موجة مؤقتة وستمر
            </h1>
            <p className="text-sm sm:text-base text-[#556442] dark:text-[#A2B193] mt-2 leading-relaxed">
              تصل ذروة الرغبة القهرية عادةً خلال ١٠ إلى ١٥ دقيقة ثم تنخفض تلقائياً إذا لم تستجب لها.
              لا تقاتل الأفكار، فقط أخّر القرار واتبع الخطوات التالية.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSurvived}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{survivedLogged ? 'تم تسجيل انتصارك الآن' : 'انتهت الموجة بنجاح'}</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-labelledby="breathing-heading"
          className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                id="breathing-heading"
                className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                تمرين التنفس المربع (٤-٤-٤-٤)
              </h2>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                يخفض استجابة التوتر العصبي ويعيد تنشيط قشرة اتخاذ القرار
              </p>
            </div>
            <span className="text-xs text-[#556442] dark:text-[#A2B193] tabular-nums">
              الدورات المكتملة: {breathCycles}
            </span>
          </div>

          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div
                className="absolute inset-4 rounded-full bg-[#C98F0A]/15 dark:bg-[#ECC93B]/20 border border-[#C98F0A]/40 dark:border-[#ECC93B]/40 transition-transform duration-1000 ease-in-out"
                style={{ transform: `scale(${circleScale})` }}
              />
              <div className="relative z-10 text-center">
                <div className="font-mono-num text-3xl font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                  {breathingActive ? phaseSecondsLeft : '4'}
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
              قاعدة تأجيل الـ ١٠ دقائق
            </h2>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
              اعقد اتفاقاً مع نفسك: لا تتخذ أي قرار قبل انتهاء هذا المؤقت
            </p>

            <div className="my-8 text-center">
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
                  ? 'انقضت العشر دقائق — لقد أثبتّ سيطرتك على الموجة'
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
                setDelaySecondsLeft(600);
                setDelayRunning(true);
              }}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193] text-sm font-medium whitespace-nowrap cursor-pointer"
            >
              إعادة ١٠ دقائق
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-labelledby="interrupt-heading"
          className="lg:col-span-7 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
        >
          <h2
            id="interrupt-heading"
            className="font-display text-lg font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
          >
            إجراءات فورية لكسر الدائرة
          </h2>
          <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
            اختر إجراءً واحداً ونفّذه الآن لتغيير الحالة الجسدية والمكانية
          </p>

          <div className="mt-4 divide-y divide-[#D5DEC0] dark:divide-[#2C3B24]">
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
        </section>

        <section
          aria-labelledby="sos-reasons-heading"
          className="lg:col-span-5 bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
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
                  className="py-3.5 text-sm text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed"
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

          <blockquote className="mt-5 pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24]">
            <p className="text-sm font-medium text-[#1C2912] dark:text-[#F3F6E9] leading-relaxed">
              «{FEATURED_RECOVERY_QUOTE.text}»
            </p>
            <footer className="text-xs text-[#9A6B06] dark:text-[#ECC93B] mt-1">
              — {FEATURED_RECOVERY_QUOTE.author}
            </footer>
          </blockquote>
        </section>
      </div>
    </div>
  );
}
