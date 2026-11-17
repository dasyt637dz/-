import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import {
  getVisualCompassSummary,
  VISUAL_ASSESSMENT_QUESTIONS,
} from '../data/recoveryContent';
import { VisualQuestionOption } from '../types/recovery';

interface OptionImageProps {
  src: string;
  alt: string;
  sizeClass?: string;
}

function OptionImage({ src, alt, sizeClass = 'w-16 h-16 sm:w-20 sm:h-20' }: OptionImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${sizeClass} rounded-xl bg-[#E5ECD0] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] shrink-0`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} rounded-xl object-cover border border-[#D5DEC0] dark:border-[#2C3B24] shrink-0 bg-[#F4F6E8]`}
    />
  );
}

interface VisualQuestionsCardProps {
  answers: Record<string, string>;
  onSelectAnswer: (questionId: string, optionId: string) => void;
  onResetAnswers: () => void;
}

export function VisualQuestionsCard({
  answers,
  onSelectAnswer,
  onResetAnswers,
}: VisualQuestionsCardProps) {
  const summary = getVisualCompassSummary(answers);
  const [editing, setEditing] = useState(!summary.isComplete);
  const [questionIdx, setQuestionIdx] = useState(() => {
    const firstUnanswered = VISUAL_ASSESSMENT_QUESTIONS.findIndex((q) => !answers[q.id]);
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });

  const currentQuestion = VISUAL_ASSESSMENT_QUESTIONS[questionIdx];
  const selectedOptionId = answers[currentQuestion.id];

  const handleChoose = (option: VisualQuestionOption) => {
    onSelectAnswer(currentQuestion.id, option.id);
    if (questionIdx < VISUAL_ASSESSMENT_QUESTIONS.length - 1) {
      window.setTimeout(() => {
        setQuestionIdx((prev) => Math.min(VISUAL_ASSESSMENT_QUESTIONS.length - 1, prev + 1));
      }, 180);
    } else {
      window.setTimeout(() => {
        setEditing(false);
      }, 200);
    }
  };

  if (!editing && summary.isComplete && summary.featuredOption) {
    return (
      <section
        aria-labelledby="visual-compass-heading"
        className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <OptionImage
              src={summary.featuredOption.imageSrc}
              alt={summary.featuredOption.imageAlt}
              sizeClass="w-24 h-24 sm:w-28 sm:h-28"
            />
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B]">
                بوصلتك الشخصية · {summary.featuredOption.archetypeTag}
              </div>
              <h2
                id="visual-compass-heading"
                className="font-display text-lg sm:text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9]"
              >
                {summary.featuredOption.title}
              </h2>
              <p className="text-sm text-[#556442] dark:text-[#A2B193] max-w-xl leading-relaxed">
                {summary.featuredOption.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setQuestionIdx(0);
                setEditing(true);
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#1C2912] dark:text-[#F3F6E9] hover:bg-[#F4F6E8] dark:hover:bg-[#222F1C] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>تعديل إجابات البوصلة</span>
            </button>
          </div>
        </div>

        {/* Summary Grid of all 4 visual answers */}
        <div className="mt-5 pt-5 border-t border-[#D5DEC0] dark:border-[#2C3B24] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.choices.map((item) => {
            if (!item.option) return null;
            return (
              <div
                key={item.label}
                className="p-3 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] flex items-center gap-3"
              >
                <OptionImage
                  src={item.option.imageSrc}
                  alt={item.option.imageAlt}
                  sizeClass="w-12 h-12"
                />
                <div className="min-w-0">
                  <div className="text-[11px] text-[#556442] dark:text-[#A2B193]">
                    {item.label}
                  </div>
                  <div className="text-xs font-semibold text-[#1C2912] dark:text-[#F3F6E9] truncate mt-0.5">
                    {item.option.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="visual-questions-heading"
      className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="text-xs font-medium text-[#9A6B06] dark:text-[#ECC93B]">
            أسئلة البوصلة المصوّرة · السؤال {questionIdx + 1} من{' '}
            {VISUAL_ASSESSMENT_QUESTIONS.length}
          </div>
          <h2
            id="visual-questions-heading"
            className="font-display text-lg sm:text-xl font-semibold text-[#1C2912] dark:text-[#F3F6E9] mt-1"
          >
            {currentQuestion.prompt}
          </h2>
          <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1">
            {currentQuestion.helper}
          </p>
        </div>

        {/* Question Step Switcher */}
        <div className="flex items-center gap-1.5">
          {VISUAL_ASSESSMENT_QUESTIONS.map((q, idx) => {
            const isCurrent = idx === questionIdx;
            const isAnswered = Boolean(answers[q.id]);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setQuestionIdx(idx)}
                aria-label={`الانتقال إلى السؤال ${idx + 1}`}
                className={`min-w-[34px] h-8 px-2 rounded-lg text-xs font-mono-num font-semibold border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#C98F0A] border-[#C98F0A] text-white dark:bg-[#ECC93B] dark:border-[#ECC93B] dark:text-[#11180E]'
                    : isAnswered
                    ? 'bg-[#C98F0A]/15 border-[#C98F0A]/30 text-[#9A6B06] dark:text-[#ECC93B]'
                    : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] text-[#556442] dark:text-[#A2B193]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options with Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleChoose(option)}
              className={`w-full p-3.5 rounded-xl border text-right flex items-center gap-4 transition-colors duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#C98F0A]/10 border-[#C98F0A] dark:bg-[#ECC93B]/15 dark:border-[#ECC93B]'
                  : 'bg-[#F4F6E8] dark:bg-[#11180E] border-[#D5DEC0] dark:border-[#2C3B24] hover:border-[#C98F0A]/60 dark:hover:border-[#ECC93B]/60'
              }`}
            >
              <OptionImage src={option.imageSrc} alt={option.imageAlt} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
                    {option.title}
                  </span>
                  {isSelected && (
                    <Check
                      className="w-4 h-4 text-[#9A6B06] dark:text-[#ECC93B] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-1 leading-relaxed">
                  {option.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="mt-5 pt-4 border-t border-[#D5DEC0] dark:border-[#2C3B24] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {questionIdx > 0 && (
            <button
              type="button"
              onClick={() => setQuestionIdx((prev) => Math.max(0, prev - 1))}
              className="min-h-[40px] px-3.5 rounded-xl border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#556442] dark:text-[#A2B193] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>السابق</span>
            </button>
          )}
          {summary.answeredCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onResetAnswers();
                setQuestionIdx(0);
              }}
              className="min-h-[40px] px-3 rounded-xl text-xs text-[#556442] dark:text-[#A2B193] hover:text-[#DC2626] cursor-pointer"
            >
              إعادة تعيين الإجابات
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {summary.isComplete && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-[40px] px-4 rounded-xl bg-[#C98F0A] dark:bg-[#ECC93B] text-white dark:text-[#11180E] text-xs font-semibold cursor-pointer"
            >
              عرض نتيجتي
            </button>
          )}
          {questionIdx < VISUAL_ASSESSMENT_QUESTIONS.length - 1 && (
            <button
              type="button"
              onClick={() =>
                setQuestionIdx((prev) =>
                  Math.min(VISUAL_ASSESSMENT_QUESTIONS.length - 1, prev + 1)
                )
              }
              className="min-h-[40px] px-4 rounded-xl bg-[#2F6318] dark:bg-[#222F1C] text-white text-xs font-medium cursor-pointer"
            >
              السؤال التالي
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
