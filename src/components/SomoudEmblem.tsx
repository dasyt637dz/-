import { Mountain } from 'lucide-react';
import { useState } from 'react';
import { SOMOUD_LOGO_SRC } from '../data/recoveryContent';

interface SomoudEmblemProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SomoudEmblem({ size = 'md', className = '' }: SomoudEmblemProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-full'
      : size === 'lg'
      ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-full'
      : 'w-11 h-11 rounded-full';

  if (imgError) {
    return (
      <div
        className={`${sizeClasses} bg-[#F4F6E8] dark:bg-[#222F1C] border border-[#D5DEC0] dark:border-[#2C3B24] flex items-center justify-center text-[#1C2912] dark:text-[#F3F6E9] shrink-0 ${className}`}
        aria-hidden="true"
      >
        <Mountain className={size === 'lg' ? 'w-10 h-10' : 'w-4 h-4'} />
      </div>
    );
  }

  return (
    <img
      src={SOMOUD_LOGO_SRC}
      alt="شعار صمود — رسم قلم رصاص لرجل يدفع صخرة"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${sizeClasses} object-cover border border-[#D5DEC0] dark:border-[#2C3B24] bg-[#F4F6E8] shrink-0 ${className}`}
    />
  );
}
