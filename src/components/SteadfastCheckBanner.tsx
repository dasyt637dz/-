import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

interface SteadfastCheckBannerProps {
  visible: boolean;
  onConfirmSteadfast: () => void;
  onNeedSupport: () => void;
  onDismiss: () => void;
}

export function SteadfastCheckBanner({
  visible,
  onConfirmSteadfast,
  onNeedSupport,
  onDismiss,
}: SteadfastCheckBannerProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirmSteadfast();
    window.setTimeout(() => {
      setConfirmed(false);
      onDismiss();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40"
          role="dialog"
          aria-label="تذكير الصمود كل ساعتين"
        >
          <div className="rounded-2xl bg-[#FCFDF7]/95 dark:bg-[#192315]/95 backdrop-blur-md border-2 border-[#2F6318]/60 dark:border-[#ECC93B]/60 p-4 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-semibold text-[#9A6B06] dark:text-[#ECC93B]">
                  اطمئنان كل ساعتين
                </div>
                <h3 className="font-display text-base font-bold text-[#1C2912] dark:text-[#F3F6E9] mt-0.5">
                  هل لا زلت صامداً؟
                </h3>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="إغلاق"
                className="p-1 rounded-lg text-[#556442] dark:text-[#A2B193] hover:bg-[#E5ECD0]/60 dark:hover:bg-[#2C3B24] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {confirmed ? (
              <div className="rounded-xl bg-[#EEF3DF] dark:bg-[#26351F] border border-[#2F6E1B]/30 px-3 py-2.5 text-xs font-medium text-[#2F6E1B] dark:text-[#65C449] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>ثبّتك الله! استمر وصلِّ على النبي ﷺ</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#556442] dark:text-[#A2B193] leading-relaxed">
                  مرّت ساعتان على آخر تذكير. جدّد نيتك الآن، صلِّ على النبي ﷺ، واختر حالتك:
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#2F6318] text-white hover:bg-[#244F12] dark:bg-[#ECC93B] dark:text-[#11180E] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>نعم، لا زلت صامداً</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDismiss();
                      onNeedSupport();
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs font-medium text-[#DC2626] dark:text-[#F87171] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>أحتاج دعماً</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
