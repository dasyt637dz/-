import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import {
  DISCOVERY_METHODS,
  VISUAL_ASSESSMENT_QUESTIONS,
} from '../data/recoveryContent';
import { OnboardingIntent, OnboardingProfile } from '../types/recovery';
import { SomoudEmblem } from './SomoudEmblem';

interface OnboardingScreenProps {
  initialProfile: OnboardingProfile;
  initialVisualAnswers: Record<string, string>;
  onComplete: (
    profile: OnboardingProfile,
    visualAnswers?: Record<string, string>
  ) => void;
}

const QUICK_AGES = [15, 18, 25, 35];

export function OnboardingScreen({
  initialProfile,
  initialVisualAnswers,
  onComplete,
}: OnboardingScreenProps) {
  const totalSteps = 3 + VISUAL_ASSESSMENT_QUESTIONS.length;
  const [step, setStep] = useState<number>(1);
  const [ageInput, setAgeInput] = useState<string>(
    initialProfile.age ? String(initialProfile.age) : ''
  );
  const [discoveryMethod, setDiscoveryMethod] = useState<string>(
    initialProfile.discoveryMethod || ''
  );
  const [discoveryCustom, setDiscoveryCustom] = useState<string>(
    initialProfile.discoveryCustom || ''
  );
  const [intent, setIntent] = useState<OnboardingIntent | null>(initialProfile.intent);
  const [visualAnswers, setVisualAnswers] = useState<Record<string, string>>(
    initialVisualAnswers
  );

  const parsedAge = ageInput.trim() ? Number(ageInput) : null;
  const isAgeValid = parsedAge === null || (parsedAge >= 10 && parsedAge <= 99);

  const handleFinish = () => {
    onComplete(
      {
        completed: true,
        age: parsedAge && parsedAge >= 10 && parsedAge <= 99 ? parsedAge : null,
        discoveryMethod: discoveryMethod || 'لا أتذكر بالضبط',
        discoveryCustom: discoveryMethod === 'شيء آخر' ? discoveryCustom.trim() : '',
        intent: intent ?? 'quit',
      },
      visualAnswers
    );
  };

  const currentVisualQuestion =
    step >= 4 ? VISUAL_ASSESSMENT_QUESTIONS[step - 4] : null;

  return (
    <div className="min-h-screen bg-[#F4F6E8] dark:bg-[#11180E] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-[#FCFDF7] dark:bg-[#192315] border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 sm:p-8">
        {/* Top Emblem & Step Progress */}
        <div className="flex flex-col items-center text-center mb-6">
          <SomoudEmblem size="lg" className="mb-4" />
          <div className="font-display text-2xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
            صمود
          </div>
          <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
            كل ما تكتبه هنا يُحفظ على جهازك فقط — لا يراه أحد غيرك
          </p>

          {/* Step Dots */}
          <div
            className="flex items-center gap-1.5 mt-5"
            aria-label={`الخطوة ${step} من ${totalSteps}`}
          >
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((dot) => (
              <span
                key={dot}
                className={`h-2 rounded-full transition-all duration-200 ${
                  step === dot
                    ? 'w-7 bg-[#C98F0A] dark:bg-[#ECC93B]'
                    : dot < step
                    ? 'w-2.5 bg-[#C98F0A]/45 dark:bg-[#ECC93B]/45'
                    : 'w-2.5 bg-[#D5DEC0] dark:bg-[#2C3B24]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Age */}
        {step === 1 && (
          <div className="space-y-5 max-w-md mx-auto">
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                كم عمرك؟
              </h1>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                يساعدنا في تخصيص نبرة المتابعة لتناسب مرحلتك
              </p>
            </div>

            <div className="flex justify-center">
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={99}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="٢٢"
                dir="ltr"
                className="w-36 h-16 text-center font-mono-num text-3xl font-bold rounded-2xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9] focus:outline-2 focus:outline-[#C98F0A]"
              />
            </div>

            {!isAgeValid && (
              <p className="text-center text-xs text-[#DC2626] dark:text-[#F87171]">
                أدخل عمراً صحيحاً بين ١٠ و ٩٩
              </p>
            )}

            <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto">
              {QUICK_AGES.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setAgeInput(String(quick))}
                  className={`min-h-[44px] rounded-xl font-mono-num text-sm font-semibold border transition-colors cursor-pointer ${
                    Number(ageInput) === quick
                      ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                      : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9]'
                  }`}
                >
                  {quick}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={!isAgeValid}
                onClick={() => setStep(2)}
                className="w-full min-h-[48px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] disabled:opacity-50 dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold transition-colors cursor-pointer"
              >
                التالي
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full min-h-[42px] text-xs font-medium text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] cursor-pointer"
              >
                متابعة مباشرة على هذا الجهاز دون إجابة
              </button>
            </div>
          </div>
        )}

        {/* Step 2: How you discovered the habit */}
        {step === 2 && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                ما هي الطريقة التي تعرّفت بها على العادة؟
              </h1>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                فهم الجذر الأول يوضح لك كيف بدأت الدائرة
              </p>
            </div>

            <div className="space-y-2">
              {DISCOVERY_METHODS.map((method) => {
                const selected = discoveryMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDiscoveryMethod(method)}
                    className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl border text-right text-sm font-medium flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#C98F0A]/10 border-[#C98F0A] text-[#9A6B06] dark:bg-[#ECC93B]/15 dark:border-[#ECC93B] dark:text-[#ECC93B]'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9]'
                    }`}
                  >
                    <span>{method}</span>
                    {selected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {discoveryMethod === 'شيء آخر' && (
              <input
                type="text"
                value={discoveryCustom}
                onChange={(e) => setDiscoveryCustom(e.target.value)}
                placeholder="اكتب بكلماتك كيف بدأت..."
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-sm text-[#1C2912] dark:text-[#F3F6E9] focus:outline-2 focus:outline-[#C98F0A]"
              />
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] px-4 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-sm font-medium text-[#556442] dark:text-[#A2B193] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                <span>رجوع</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 min-h-[48px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold transition-colors cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Intent */}
        {step === 3 && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9] text-balance">
                هل أنت هنا فعلاً لأنك تريد التوقف أم بدافع الفضول فقط؟
              </h1>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                كن صادقاً مع نفسك — لا أحد يحكم عليك هنا
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIntent('quit')}
                className={`w-full min-h-[54px] px-4 py-3.5 rounded-xl border text-right text-sm font-semibold flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  intent === 'quit'
                    ? 'bg-[#C98F0A]/10 border-[#C98F0A] text-[#9A6B06] dark:bg-[#ECC93B]/15 dark:border-[#ECC93B] dark:text-[#ECC93B]'
                    : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9]'
                }`}
              >
                <span>أنا هنا لأني أريد التوقف فعلاً</span>
                {intent === 'quit' && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={() => setIntent('curious')}
                className={`w-full min-h-[54px] px-4 py-3.5 rounded-xl border text-right text-sm font-semibold flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  intent === 'curious'
                    ? 'bg-[#FEF4BE]/60 border-[#D97706] text-[#92400E] dark:bg-[#78350F]/30 dark:border-[#F59E0B] dark:text-[#F8DF6B]'
                    : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#1C2912] dark:text-[#F3F6E9]'
                }`}
              >
                <span>أنا هنا بدافع الفضول فقط</span>
                {intent === 'curious' && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </button>
            </div>

            {intent === 'curious' && (
              <p className="text-xs text-center text-[#92400E] dark:text-[#FDE88A] bg-[#FEF4BE]/50 dark:bg-[#78350F]/25 rounded-xl py-2.5 px-3 leading-relaxed">
                لا أحد يُلزمك بشيء — جرّب عشرة أيام من الملاحظة فقط ثم قرّر بنفسك.
              </p>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[48px] px-4 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-sm font-medium text-[#556442] dark:text-[#A2B193] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                <span>رجوع</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 min-h-[48px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold transition-colors cursor-pointer"
              >
                التالي (أسئلة البوصلة بالصور)
              </button>
            </div>
          </div>
        )}

        {/* Steps 4-7: Visual Questions with Images Next to Answers */}
        {currentVisualQuestion && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                {currentVisualQuestion.prompt}
              </h1>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
                {currentVisualQuestion.helper}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentVisualQuestion.options.map((opt) => {
                const selected = visualAnswers[currentVisualQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setVisualAnswers((prev) => ({
                        ...prev,
                        [currentVisualQuestion.id]: opt.id,
                      }))
                    }
                    className={`p-3 rounded-xl border text-right flex items-center gap-3.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#C98F0A]/10 border-[#C98F0A] dark:bg-[#ECC93B]/15 dark:border-[#ECC93B]'
                        : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] hover:border-[#C98F0A]/60'
                    }`}
                  >
                    <img
                      src={opt.imageSrc}
                      alt={opt.imageAlt}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#D5DEC0] dark:border-[#2C3B24]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                          {opt.title}
                        </span>
                        {selected && (
                          <Check
                            className="w-4 h-4 text-[#9A6B06] dark:text-[#ECC93B] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1 leading-relaxed">
                        {opt.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="min-h-[48px] px-4 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-sm font-medium text-[#556442] dark:text-[#A2B193] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                <span>رجوع</span>
              </button>

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev + 1)}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold transition-colors cursor-pointer"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-semibold transition-colors cursor-pointer"
                >
                  ابدأ رحلتي
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
