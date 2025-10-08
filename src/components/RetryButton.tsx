import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  text?: string;
  className?: string;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  isLoading = false,
  disabled = false,
  text = 'Retry',
  className = ''
}) => {
  return (
    <button
      onClick={onRetry}
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors ${className}`}
    >
      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Retrying...' : text}
    </button>
  );
};

export default RetryButton;