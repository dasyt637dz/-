import { Mountain } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 1850);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-[#F4F6E8] dark:bg-[#11180E] text-[#1C2912] dark:text-[#F3F6E9] flex flex-col items-center justify-center p-6 select-none"
      role="status"
      aria-label="جاري فتح تطبيق صمود"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.02 : 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-xs w-full"
      >
        <div className="relative mb-5">
          {!imgFailed ? (
            <img
              src="/assets/aistudio/9b9ca576e63c0a38ebe41757135ff80a_8c088635.jpg"
              alt="شعار الترحيب — محارب مبتسم بسلام وسط الجبال الخضراء"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover object-top border-2 border-[#D9A714]/70 dark:border-[#ECC93B]/60 shadow-md bg-[#E5ECD0] dark:bg-[#192315]"
            />
          ) : (
            <div
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-[#FCFDF7] dark:bg-[#192315] border-2 border-[#D9A714]/70 dark:border-[#ECC93B]/60 flex items-center justify-center"
              aria-hidden="true"
            >
              <Mountain className="w-12 h-12 text-[#2F6318] dark:text-[#ECC93B]" />
            </div>
          )}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#1C2912] dark:text-[#F3F6E9]">
          صمود
        </h1>
        <p className="text-sm text-[#556442] dark:text-[#A2B193] mt-2 leading-relaxed">
          رفيقك اليومي للثبات واستعادة الصفاء
        </p>

        {/* Native App Loading Bar */}
        <div className="mt-7 w-44 h-1.5 rounded-full bg-[#E5ECD0] dark:bg-[#2C3B24] overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.75, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'right center' }}
            className="w-full h-full rounded-full bg-[#2F6318] dark:bg-[#ECC93B]"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
