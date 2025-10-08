import React from 'react';
import { Shield, ShieldOff } from 'lucide-react';

interface SafeModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SafeModeToggle: React.FC<SafeModeToggleProps> = ({
  enabled,
  onChange,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-13'
  };

  const thumbSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        {enabled ? (
          <Shield className={`text-green-600 ${iconSizeClasses[size]}`} />
        ) : (
          <ShieldOff className={`text-orange-600 ${iconSizeClasses[size]}`} />
        )}
        <span className="text-sm font-medium text-gray-700">
          Safe Mode
        </span>
      </div>
      
      <button
        type="button"
        className={`
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${enabled 
            ? 'bg-gradient-to-r from-green-400 to-green-600' 
            : 'bg-gradient-to-r from-gray-300 to-gray-400'
          }
          ${sizeClasses[size]}
        `}
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle safe mode"
        onClick={() => onChange(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 
            transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
            ${thumbSizeClasses[size]}
          `}
        />
      </button>
      
      <div className="text-xs text-gray-500">
        {enabled ? 'Filtered content' : 'All content'}
      </div>
    </div>
  );
};

// Compact version for mobile/small spaces
export const CompactSafeModeToggle: React.FC<Omit<SafeModeToggleProps, 'size'>> = ({
  enabled,
  onChange,
  className = ''
}) => {
  return (
    <button
      type="button"
      className={`
        flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-200 ease-in-out
        ${enabled 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-orange-100 text-orange-800 border border-orange-200'
        }
        hover:shadow-sm active:scale-95
        ${className}
      `}
      onClick={() => onChange(!enabled)}
      aria-label="Toggle safe mode"
    >
      {enabled ? (
        <Shield className="w-3 h-3" />
      ) : (
        <ShieldOff className="w-3 h-3" />
      )}
      <span>
        {enabled ? 'Safe' : 'All'}
      </span>
    </button>
  );
};