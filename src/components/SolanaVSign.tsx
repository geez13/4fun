import React from 'react'

interface SolanaVSignProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SolanaVSign: React.FC<SolanaVSignProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hand base */}
      <path
        d="M8 20c-1.5 0-2.5-1-2.5-2.5V14c0-1 0.5-2 1.5-2.5L9 10.5c0.5-0.3 1-0.5 1.5-0.5h1c0.8 0 1.5 0.7 1.5 1.5v1"
        fill="#14F195"
        stroke="#00FFBD"
        strokeWidth="1"
      />
      
      {/* Index finger (V sign) */}
      <path
        d="M13 12v-6c0-1 0.5-2 1.5-2s1.5 1 1.5 2v6"
        fill="#00FFBD"
        stroke="#14F195"
        strokeWidth="1"
      />
      
      {/* Middle finger (V sign) */}
      <path
        d="M16 12v-7c0-1 0.5-2 1.5-2s1.5 1 1.5 2v7"
        fill="#00FFBD"
        stroke="#14F195"
        strokeWidth="1"
      />
      
      {/* Ring finger (folded) */}
      <path
        d="M19 12v2c0 0.5-0.5 1-1 1s-1-0.5-1-1v-2"
        fill="#14F195"
        stroke="#00FFBD"
        strokeWidth="1"
      />
      
      {/* Pinky finger (folded) */}
      <path
        d="M17 14v1c0 0.5-0.5 1-1 1s-1-0.5-1-1v-1"
        fill="#14F195"
        stroke="#00FFBD"
        strokeWidth="1"
      />
      
      {/* Thumb */}
      <path
        d="M11 13c-0.5 0-1-0.5-1-1v-1c0-0.5 0.5-1 1-1s1 0.5 1 1v1c0 0.5-0.5 1-1 1"
        fill="#14F195"
        stroke="#00FFBD"
        strokeWidth="1"
      />
      
      {/* Glow effect */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFBD" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default SolanaVSign