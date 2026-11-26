import { useId } from 'react';

interface FillFigureProps {
  percentage: number;
  ariaLabel: string;
}

const BRAIN_OUTLINE_PATH =
  'M 26 76 C 20 58, 28 34, 50 23 C 70 13, 102 12, 126 23 C 148 33, 160 54, 156 76 C 154 88, 146 96, 138 100 C 142 110, 136 122, 121 124 C 110 126, 101 121, 96 116 L 93 134 C 92 138, 86 139, 82 136 L 78 112 C 67 115, 53 113, 44 106 C 32 102, 24 91, 26 76 Z';

const BODY_OUTLINE_PATH =
  'M 63 43 L 77 43 C 83 45, 96 49, 102 58 C 107 66, 113 94, 114 111 C 114 116, 108 118, 104 113 C 101 100, 97 82, 93 72 L 90 112 L 88 173 C 88 178, 76 178, 76 173 L 73 122 C 71 119, 69 119, 67 122 L 64 173 C 64 178, 52 178, 52 173 L 50 112 L 47 72 C 43 82, 39 100, 36 113 C 32 118, 26 116, 26 111 C 27 94, 33 66, 38 58 C 44 49, 57 45, 63 43 Z';

export function BrainFillFigure({ percentage, ariaLabel }: FillFigureProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `brain-clip-${uid}`;
  const gradId = `brain-grad-${uid}`;
  const clamped = Math.max(0, Math.min(100, percentage));

  // Vertical span of brain silhouette: y=14 (top) to y=138 (bottom)
  const fillY = 138 - (clamped / 100) * 124;

  return (
    <svg
      viewBox="0 0 180 150"
      role="img"
      aria-label={ariaLabel}
      className="w-32 h-28 sm:w-36 sm:h-30 shrink-0 select-none"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BRAIN_OUTLINE_PATH} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#9A6B06" />
          <stop offset="60%" stopColor="#C98F0A" />
          <stop offset="100%" stopColor="#ECC93B" />
        </linearGradient>
      </defs>

      {/* Empty vessel background */}
      <path
        d={BRAIN_OUTLINE_PATH}
        className="fill-[#E8EED6] dark:fill-[#11180E]"
      />

      {/* Clipped rising fill */}
      <g clipPath={`url(#${clipId})`}>
        {clamped > 0 && (
          <>
            {clamped >= 99 ? (
              <rect x="0" y="0" width="180" height="150" fill={`url(#${gradId})`} />
            ) : (
              <path
                d={`M 10 ${fillY} Q 50 ${fillY - 5}, 90 ${fillY} T 170 ${fillY} L 170 150 L 10 150 Z`}
                fill={`url(#${gradId})`}
                className="transition-all duration-500 ease-out"
              />
            )}
            {clamped < 98 && (
              <path
                d={`M 10 ${fillY} Q 50 ${fillY - 5}, 90 ${fillY} T 170 ${fillY}`}
                fill="none"
                stroke="#F8DF6B"
                strokeWidth="2"
                strokeOpacity="0.75"
              />
            )}
          </>
        )}
      </g>

      {/* Anatomical sulci & folds (visible over both empty and filled zones) */}
      <g
        fill="none"
        strokeLinecap="round"
        className="stroke-[#785204]/45 dark:stroke-[#F3F6E9]/35"
        strokeWidth="2"
      >
        <path d="M 60 28 C 66 40, 58 50, 48 52" />
        <path d="M 92 22 C 94 36, 86 48, 76 52" />
        <path d="M 122 30 C 118 44, 126 54, 138 56" />
        <path d="M 42 74 C 58 68, 72 74, 80 86" />
        <path d="M 88 68 C 102 62, 118 66, 132 76" />
        <path d="M 104 96 C 114 92, 128 94, 136 100" />
        <path d="M 104 108 C 114 106, 126 108, 134 114" />
      </g>

      {/* Outer crisp outline */}
      <path
        d={BRAIN_OUTLINE_PATH}
        fill="none"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="stroke-[#9A6B06] dark:stroke-[#ECC93B]"
      />
    </svg>
  );
}

export function BodyFillFigure({ percentage, ariaLabel }: FillFigureProps) {
  const uid = useId().replace(/:/g, '');
  const clipId = `body-clip-${uid}`;
  const gradId = `body-grad-${uid}`;
  const clamped = Math.max(0, Math.min(100, percentage));

  // Vertical span of standing figure: y=11 (crown of head) to y=178 (feet)
  const fillY = 178 - (clamped / 100) * 167;

  return (
    <svg
      viewBox="0 0 140 190"
      role="img"
      aria-label={ariaLabel}
      className="w-28 h-32 sm:w-32 sm:h-36 shrink-0 select-none"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="70" cy="26" r="15" />
          <path d={BODY_OUTLINE_PATH} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#1F5111" />
          <stop offset="55%" stopColor="#2F6E1B" />
          <stop offset="100%" stopColor="#65C449" />
        </linearGradient>
      </defs>

      {/* Empty silhouette background */}
      <g className="fill-[#E8EED6] dark:fill-[#11180E]">
        <circle cx="70" cy="26" r="15" />
        <path d={BODY_OUTLINE_PATH} />
      </g>

      {/* Clipped rising fill */}
      <g clipPath={`url(#${clipId})`}>
        {clamped > 0 && (
          <>
            {clamped >= 99 ? (
              <rect x="0" y="0" width="140" height="190" fill={`url(#${gradId})`} />
            ) : (
              <path
                d={`M 10 ${fillY} Q 40 ${fillY - 4}, 70 ${fillY} T 130 ${fillY} L 130 190 L 10 190 Z`}
                fill={`url(#${gradId})`}
                className="transition-all duration-500 ease-out"
              />
            )}
            {clamped < 98 && (
              <path
                d={`M 10 ${fillY} Q 40 ${fillY - 4}, 70 ${fillY} T 130 ${fillY}`}
                fill="none"
                stroke="#9FE888"
                strokeWidth="2"
                strokeOpacity="0.8"
              />
            )}
          </>
        )}
      </g>

      {/* Subtle inner posture guide */}
      <path
        d="M 70 55 L 70 98 M 56 64 C 65 68, 75 68, 84 64"
        fill="none"
        strokeLinecap="round"
        strokeWidth="1.75"
        className="stroke-[#2F6E1B]/35 dark:stroke-[#F3F6E9]/30"
      />

      {/* Crisp silhouette borders */}
      <g
        fill="none"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="stroke-[#2F6E1B] dark:stroke-[#65C449]"
      >
        <circle cx="70" cy="26" r="15" />
        <path d={BODY_OUTLINE_PATH} />
      </g>
    </svg>
  );
}
