import { Crown, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getLocalizedStreakTitle, getTranslations } from '../i18n/translations';
import { AppLanguage } from '../types/recovery';

export interface AchievementAlert {
  id: string;
  kind: 'title' | 'cup';
  titleDays: number;
  cups: number;
}

interface AchievementBannerProps {
  alert: AchievementAlert | null;
  language: AppLanguage;
  onDismiss: () => void;
}

export function AchievementBanner({
  alert,
  language,
  onDismiss,
}: AchievementBannerProps) {
  const t = getTranslations(language);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-16 sm:top-20 inset-x-0 z-50 px-4 flex justify-center pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#FCFDF7]/98 dark:bg-[#192315]/98 backdrop-blur-md border-2 border-[#C98F0A] dark:border-[#ECC93B] shadow-xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FEF4BE] dark:bg-[#26351F] border border-[#D9A714]/60 dark:border-[#ECC93B]/60 flex items-center justify-center shrink-0">
              {alert.kind === 'title' ? (
                <Crown className="w-6 h-6 text-[#C98F0A] dark:text-[#ECC93B] fill-[#C98F0A]/25 dark:fill-[#ECC93B]/25" aria-hidden="true" />
              ) : (
                <Trophy className="w-6 h-6 text-[#C98F0A] dark:text-[#ECC93B] fill-[#C98F0A]/25 dark:fill-[#ECC93B]/25" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                {alert.kind === 'title'
                  ? t.achievementTitleBannerHeading
                  : t.achievementCupBannerHeading}
              </div>
              <div className="font-display text-base sm:text-lg font-bold text-[#1C2912] dark:text-[#F3F6E9] leading-snug mt-0.5">
                {alert.kind === 'title'
                  ? `${t.youAreNowPrefix}: ${getLocalizedStreakTitle(alert.titleDays, language)}`
                  : `${t.achievementCupBannerHeading} (${alert.cups} / 10)`}
              </div>
              <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
                {t.cupEarnedDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label={t.closeLabel}
              className="p-1.5 rounded-lg text-[#556442] dark:text-[#A2B193] hover:bg-[#E5ECD0]/60 dark:hover:bg-[#2C3B24] shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
