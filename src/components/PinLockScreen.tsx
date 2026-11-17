import { Delete } from 'lucide-react';
import { useState } from 'react';
import { SomoudEmblem } from './SomoudEmblem';

interface PinLockScreenProps {
  expectedPin: string;
  onUnlock: () => void;
}

export function PinLockScreen({ expectedPin, onUnlock }: PinLockScreenProps) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    setError(false);

    if (next.length === 4) {
      if (next === expectedPin) {
        onUnlock();
      } else {
        setError(true);
        window.setTimeout(() => {
          setEntered('');
        }, 350);
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    setEntered((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#F4F6E8] dark:bg-[#11180E] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#FCFDF7] dark:bg-[#192315] border border-[#D5DEC0] dark:border-[#2C3B24] rounded-2xl p-6 sm:p-8 text-center">
        <SomoudEmblem size="md" className="mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-[#1C2912] dark:text-[#F3F6E9]">
          صمود · قفل الخصوصية
        </h1>
        <p className="text-sm text-[#556442] dark:text-[#A2B193] mt-1.5">
          أدخل رمز الحماية المكون من ٤ أرقام للمتابعة
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 my-6" dir="ltr">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < entered.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-colors duration-150 ${
                  error
                    ? 'bg-[#DC2626] border-[#DC2626]'
                    : filled
                    ? 'bg-[#C98F0A] border-[#C98F0A] dark:bg-[#ECC93B] dark:border-[#ECC93B]'
                    : 'border-[#BECA9E] dark:border-[#3C5031]'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-medium text-[#DC2626] dark:text-[#F87171] mb-4">
            الرمز غير صحيح، حاول مرة أخرى
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto" dir="ltr">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] hover:bg-[#E5ECD0] dark:hover:bg-[#2B3B24] text-lg font-medium text-[#1C2912] dark:text-[#F3F6E9] tabular-nums transition-colors duration-150 cursor-pointer active:scale-95"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] hover:bg-[#E5ECD0] dark:hover:bg-[#2B3B24] text-lg font-medium text-[#1C2912] dark:text-[#F3F6E9] tabular-nums transition-colors duration-150 cursor-pointer active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="حذف رقم"
            className="h-12 rounded-xl bg-[#F4F6E8] dark:bg-[#222F1C] hover:bg-[#E5ECD0] dark:hover:bg-[#2B3B24] text-[#556442] dark:text-[#A2B193] flex items-center justify-center transition-colors duration-150 cursor-pointer active:scale-95"
          >
            <Delete className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
