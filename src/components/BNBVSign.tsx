import React from 'react';

interface BNBVSignProps {
  className?: string;
  size?: number;
}

export const BNBVSign: React.FC<BNBVSignProps> = ({ 
  className = '', 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bnbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF41" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
      </defs>
      
      {/* V Sign Hand */}
      <path
        d="M8 4L12 16L16 4"
        stroke="url(#bnbGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Fingers */}
      <path
        d="M8 4L10 8"
        stroke="url(#bnbGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      <path
        d="M16 4L14 8"
        stroke="url(#bnbGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* BNB Chain accent dots */}
      <circle cx="6" cy="6" r="1" fill="#00FF41" />
      <circle cx="18" cy="6" r="1" fill="#00FF41" />
      <circle cx="12" cy="20" r="1.5" fill="#00FF88" />
    </svg>
  );
};

export default BNBVSign;