import { CheckCircle2, Download, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'settings';
}

export function PWAInstallButton({ variant = 'settings' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (variant === 'banner') {
    if (isInstalled || dismissed || (!isInstallable && !isIOS)) {
      return null;
    }

    return (
      <div className="bg-[#FCFDF7]/90 dark:bg-[#192315]/90 backdrop-blur-md border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#2F6318]/10 dark:bg-[#ECC93B]/15 text-[#2F6318] dark:text-[#ECC93B] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
              ثبّت تطبيق «صمود» على هاتفك
            </div>
            <p className="text-xs text-[#556442] dark:text-[#A2B193] mt-0.5">
              يعمل كتطبيق مستقل بشاشة كاملة وبدون إنترنت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>تثبيت التطبيق</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>طريقة التثبيت</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="إغلاق التلميح"
            className="min-h-[40px] min-w-[40px] rounded-xl text-[#556442] dark:text-[#A2B193] hover:text-[#1C2912] dark:hover:text-[#F3F6E9] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {showIOSGuide && (
          <div className="w-full pt-3 border-t border-[#D5DEC0] dark:border-[#2C3B24] text-xs text-[#556442] dark:text-[#A2B193] space-y-1">
            <p className="font-medium text-[#1C2912] dark:text-[#F3F6E9]">
              للتثبيت على أجهزة آيفون وآيباد (Safari):
            </p>
            <p>١. اضغط على زر المشاركة (Share) في شريط المتصفح السفلي.</p>
            <p>٢. اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</p>
          </div>
        )}
      </div>
    );
  }

  // Settings view variant
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-medium text-[#2F6E1B] dark:text-[#65C449]">
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>التطبيق مثبّت ويعمل الآن كتطبيق مستقل بدون متصفح</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {isInstallable ? (
          <button
            type="button"
            onClick={install}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>تثبيت التطبيق على جهازك</span>
          </button>
        ) : isIOS ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide((prev) => !prev)}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>تثبيت على آيفون / آيباد</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowManualHint((prev) => !prev)}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#2F6318] hover:bg-[#244F12] dark:bg-[#ECC93B] dark:hover:bg-[#F4D658] text-white dark:text-[#11180E] text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>تثبيت التطبيق على الهاتف</span>
          </button>
        )}
      </div>

      {showIOSGuide && (
        <div className="p-3.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs text-[#556442] dark:text-[#A2B193] space-y-1 leading-relaxed">
          <p className="font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
            خطوات التثبيت في Safari:
          </p>
          <p>١. افتح الرابط في متصفح Safari واضغط أيقونة المشاركة.</p>
          <p>٢. مرر للأسفل واضغط «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</p>
        </div>
      )}

      {showManualHint && (
        <div className="p-3.5 rounded-xl bg-[#F4F6E8] dark:bg-[#11180E] border border-[#D5DEC0] dark:border-[#2C3B24] text-xs text-[#556442] dark:text-[#A2B193] space-y-1 leading-relaxed">
          <p className="font-semibold text-[#1C2912] dark:text-[#F3F6E9]">
            التثبيت من متصفح الهاتف (Chrome / Brave / Edge):
          </p>
          <p>١. افتح رابط التطبيق المنشور في متصفح هاتفك.</p>
          <p>٢. اضغط قائمة المتصفح (⋮) واختر «تثبيت التطبيق» أو «الإضافة إلى الشاشة الرئيسية».</p>
        </div>
      )}
    </div>
  );
}
