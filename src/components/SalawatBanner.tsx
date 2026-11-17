import { Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface SalawatBannerProps {
  visible: boolean;
  countdown: number;
  runId: number;
  onDismiss: () => void;
}

export function SalawatBanner({
  visible,
  countdown,
  runId,
  onDismiss,
}: SalawatBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={runId}
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-16 sm:top-18 inset-x-0 z-50 px-4 flex justify-center pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#FCFDF7]/95 dark:bg-[#192315]/95 backdrop-blur-md border-2 border-[#C98F0A]/75 dark:border-[#ECC93B]/75 shadow-lg overflow-hidden text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C98F0A]"
          >
            <div className="px-5 pt-3.5 pb-3 flex flex-col items-center gap-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#FEF4BE] dark:bg-[#26351F] border border-[#D9A714]/60 dark:border-[#ECC93B]/50 flex items-center justify-center shrink-0">
                  <Sparkles
                    className="w-3.5 h-3.5 text-[#9A6B06] dark:text-[#ECC93B]"
                    aria-hidden="true"
                  />
                </span>
                <span className="font-display text-lg sm:text-xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
                  صلي على النبي
                </span>
                <span className="text-base font-semibold text-[#C98F0A] dark:text-[#ECC93B]">
                  ﷺ
                </span>
              </div>

              {/* 3-second countdown directly underneath */}
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#556442] dark:text-[#A2B193]">
                <span>تختفي بعد</span>
                <span
                  className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#FEF4BE] dark:bg-[#26351F] border border-[#D9A714]/50 dark:border-[#ECC93B]/40 font-mono font-bold text-[#785204] dark:text-[#ECC93B] tabular-nums"
                >
                  {countdown}
                </span>
                <span>{countdown === 1 ? 'ثانية' : 'ثوانٍ'}</span>
              </div>
            </div>

            {/* Smooth 3-second countdown bar */}
            <div className="h-1 w-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: 'linear' }}
                style={{ transformOrigin: 'right center' }}
                className="h-full w-full bg-gradient-to-l from-[#2F6318] via-[#C98F0A] to-[#D9A714] dark:from-[#65C449] dark:to-[#ECC93B]"
              />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
