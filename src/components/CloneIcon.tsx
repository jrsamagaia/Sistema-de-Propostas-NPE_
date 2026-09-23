import React from 'react';

interface CloneIconProps {
  size?: number | string;
  className?: string;
}

export const CloneIcon: React.FC<CloneIconProps> = ({ size = 18, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bottom-left document */}
      <rect
        x="6"
        y="46"
        width="32"
        height="48"
        rx="4"
        stroke="currentColor"
        strokeWidth="7"
        fill="none"
      />
      <line x1="14" y1="58" x2="30" y2="58" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="14" y1="70" x2="30" y2="70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="14" y1="82" x2="30" y2="82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

      {/* Top-right document */}
      <rect
        x="62"
        y="6"
        width="32"
        height="48"
        rx="4"
        stroke="currentColor"
        strokeWidth="7"
        fill="none"
      />
      <line x1="70" y1="18" x2="86" y2="18" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="70" y1="30" x2="86" y2="30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="70" y1="42" x2="86" y2="42" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

      {/* Top curved arrow: clockwise from bottom-left doc towards top-right doc */}
      <path
        d="M 16 38 C 16 19 32 7 51 7"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 39 3 L 53 7 L 44 20"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Bottom curved arrow: clockwise from top-right doc towards bottom-left doc */}
      <path
        d="M 84 62 C 84 81 68 93 49 93"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 61 97 L 47 93 L 56 80"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default CloneIcon;
