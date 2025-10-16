import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, ExternalLink, Coins, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import RetryButton from './RetryButton';
import { QUAD_TOKEN_CA, QUAD_TOKEN_BUY_URL, QUAD_TOKEN_DISPLAY_NAME, QUAD_TOKEN_DECIMALS_OVERRIDE } from '../lib/tokenConfig';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

interface ConditionalUploadZoneProps {
  hasTokenAccess: boolean;
  sessionToken?: string | null;
  onImageUploaded?: (imageData: { file: File; url: string; imageId: string }) => void;
  onAccessDenied?: () => void;
  className?: string;
  requiredTokens?: number;
  currentBalance?: number;
  isDragOver?: boolean;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
}

interface UploadResponse {
  success: boolean;
  data?: {
    imageId: string;
    originalUrl: string;
    fileName: string;
    fileSize: number;
    tokenGated?: boolean;
  };
  error?: string;
  message?: string;
}

const ConditionalUploadZone: React.FC<ConditionalUploadZoneProps> = ({
  hasTokenAccess,
  sessionToken,
  onImageUploaded,
  onAccessDenied,
  className = '',
  requiredTokens = 1,
  currentBalance = 0,
  isDragOver: externalIsDragOver,
  onDragOver: externalOnDragOver,
  onDragLeave: externalOnDragLeave,
  onDrop: externalOnDrop,
  onFileSelect: externalOnFileSelect,
  fileInputRef: externalFileInputRef
}) => {
  const [internalIsDragOver, setInternalIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  
  // Use external props if provided, otherwise use internal state
  const isDragOver = externalIsDragOver !== undefined ? externalIsDragOver : internalIsDragOver;
  const fileInputRef = externalFileInputRef || internalFileInputRef;

  const handleFileSelect = useCallback(async (file: File) => {
    if (!hasTokenAccess || !sessionToken) {
      toast.error('Token verification required');
      onAccessDenied?.();
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setLastFile(file);

    try {
      const result = await apiService.uploadImageGated(file, sessionToken);

      if (result.success && result.data) {
        toast.success(`Image uploaded successfully with ${QUAD_TOKEN_DISPLAY_NAME} verification!`);
        const imageUrl = URL.createObjectURL(file);
        onImageUploaded?.({
          file,
          url: imageUrl,
          imageId: result.data.imageId
        });
        setUploadError(null);
        setLastFile(null);
      } else {
        const errorMessage = result.error || 'Upload failed';
        setUploadError(errorMessage);
        toast.error(errorMessage);
        if (result.error === 'Unauthorized' || result.error === 'Forbidden') {
          onAccessDenied?.();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = 'Failed to upload image. Please try again.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [hasTokenAccess, sessionToken, onImageUploaded, onAccessDenied]);

  const handleRetryUpload = useCallback(() => {
    if (lastFile) {
      handleFileSelect(lastFile);
    }
  }, [lastFile, handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (externalOnDrop) {
      externalOnDrop(e);
    } else {
      e.preventDefault();
      setInternalIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    }
  }, [externalOnDrop, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (externalOnDragOver) {
      externalOnDragOver(e);
    } else {
      e.preventDefault();
      setInternalIsDragOver(true);
    }
  }, [externalOnDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (externalOnDragLeave) {
      externalOnDragLeave(e);
    } else {
      e.preventDefault();
      setInternalIsDragOver(false);
    }
  }, [externalOnDragLeave]);

  const handleClick = useCallback(() => {
    if (hasTokenAccess && sessionToken) {
      fileInputRef.current?.click();
    } else {
      onAccessDenied?.();
    }
  }, [hasTokenAccess, sessionToken, onAccessDenied]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (externalOnFileSelect) {
      externalOnFileSelect(e);
    } else {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    }
  }, [externalOnFileSelect, handleFileSelect]);

  // Read $四 token balance dynamically if wallet is connected
  const { address } = useAccount();

  const erc20Abi = [
    {
      type: 'function',
      name: 'balanceOf',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: 'balance', type: 'uint256' }]
    },
    {
      type: 'function',
      name: 'decimals',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: 'decimals', type: 'uint8' }]
    }
  ] as const;

  const { data: rawBalance } = useReadContract({
    address: QUAD_TOKEN_CA as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) }
  });

  const { data: tokenDecimals } = useReadContract({
    address: QUAD_TOKEN_CA as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: Boolean(address) }
  });

  const decimals = tokenDecimals ?? QUAD_TOKEN_DECIMALS_OVERRIDE ?? 18;
  const formattedBalance = rawBalance !== undefined
    ? Number(formatUnits(rawBalance as bigint, decimals)).toFixed(4)
    : currentBalance.toFixed(4);

  // Access denied state
  if (!hasTokenAccess) {
    return (
      <div className={`relative border-2 border-dashed border-red-500/50 rounded-xl p-12 text-center bg-gradient-to-br from-red-900/10 to-orange-900/10 backdrop-blur-sm ${className}`}>
        <div className="flex flex-col items-center">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{QUAD_TOKEN_DISPLAY_NAME} Token Required</h3>
          <p className="text-gray-400 mb-4">
            You need at least {requiredTokens} {QUAD_TOKEN_DISPLAY_NAME} to access AI-enhanced image upload.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Coins className="w-4 h-4" />
            <span>
              Current Balance: {formattedBalance} {QUAD_TOKEN_DISPLAY_NAME}
            </span>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <a
                href={`https://bscscan.com/token/${QUAD_TOKEN_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium w-full sm:w-auto"
                aria-label="View token contract on BSCScan"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="font-mono truncate max-w-[220px] sm:max-w-none">CA: {QUAD_TOKEN_CA}</span>
              </a>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={QUAD_TOKEN_BUY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors font-medium w-full sm:w-auto"
                aria-label="Buy $四 token on four.meme"
              >
                <ExternalLink className="w-5 h-5" />
                Buy {QUAD_TOKEN_DISPLAY_NAME} on four.meme
              </a>
              <a
                href={`https://pancakeswap.finance/swap?outputCurrency=${QUAD_TOKEN_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors font-medium w-full sm:w-auto"
                aria-label="Buy $四 token on PancakeSwap"
              >
                <ExternalLink className="w-5 h-5" />
                Buy on PancakeSwap
              </a>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Get {QUAD_TOKEN_DISPLAY_NAME} to unlock AI image enhancement features.
          </p>
        </div>
      </div>
    );
  }

  // Token access granted - show upload zone
  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-purple-400 bg-purple-900/20 scale-105'
            : hasTokenAccess
            ? 'border-green-500/50 bg-gradient-to-br from-green-900/10 to-emerald-900/10 hover:border-green-400 hover:bg-green-900/20'
            : 'border-gray-600 bg-gray-900/20'
        } backdrop-blur-sm ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          {isUploading ? (
            <>
              <LoadingSpinner size="lg" />
              <h3 className="text-xl font-semibold text-white mb-2 mt-4">Uploading Image</h3>
              <p className="text-gray-400">
                Uploading with {QUAD_TOKEN_DISPLAY_NAME} token verification...
              </p>
            </>
          ) : uploadError ? (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Upload Failed</h3>
              <p className="text-gray-400 mb-4 text-center">
                {uploadError}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <RetryButton
                  onRetry={handleRetryUpload}
                  isLoading={isUploading}
                  text="Retry Upload"
                />
                <button
                  onClick={() => {
                    setUploadError(null);
                    setLastFile(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Choose Different File
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative mb-4">
                <Upload className="w-16 h-16 text-green-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Coins className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop Image or Click to Browse
              </h3>
              <p className="text-gray-400 mb-4">
                Upload your image for AI-enhanced V-sign processing
              </p>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Coins className="w-4 h-4" />
                <span>{QUAD_TOKEN_DISPLAY_NAME} Token Verified ✓</span>
              </div>
            </>
          )}
        </div>
        
        {isDragOver && (
          <div className="absolute inset-0 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <div className="text-purple-300 font-medium">Drop your image here</div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Supported formats: JPG, PNG, GIF, WebP • Max size: 10MB
        </p>
      </div>
    </div>
  );
};

export default ConditionalUploadZone;