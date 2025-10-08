import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import RetryButton from './RetryButton';

interface TokenGateCheckerProps {
  children: React.ReactNode;
  requiredTokens?: number;
  className?: string;
  onAccessGranted?: (sessionToken: string) => void;
  onAccessDenied?: () => void;
}

interface TokenGateStatus {
  isLoading: boolean;
  hasAccess: boolean;
  tokenBalance: number;
  sessionToken?: string;
  error?: string;
  isVerifying?: boolean;
}

export const TokenGateChecker: React.FC<TokenGateCheckerProps> = ({ 
  children, 
  requiredTokens = 1,
  className = '',
  onAccessGranted,
  onAccessDenied
}) => {
  const { connected, publicKey, signMessage } = useWallet();
  const [status, setStatus] = useState<TokenGateStatus>({
    isLoading: false,
    hasAccess: false,
    tokenBalance: 0,
    isVerifying: false
  });

  const checkTokenAccess = async () => {
    if (!connected || !publicKey) {
      setStatus({ isLoading: false, hasAccess: false, tokenBalance: 0, isVerifying: false });
      return;
    }

    // Start verification immediately when wallet is connected
    await verifyTokenAccess();
  };

  const verifyTokenAccess = async () => {
    if (!connected || !publicKey || !signMessage) {
      toast.error('Wallet not properly connected');
      return;
    }

    setStatus(prev => ({ ...prev, isVerifying: true, error: undefined }));

    try {
      // Create verification message
      const message = `Verify token access for V-Sign Magic\nWallet: ${publicKey.toString()}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);
      
      // Sign the message
      const signature = await signMessage(messageBytes);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      // Send verification request to backend using API service
      const result = await apiService.verifyTokenAccess(
        publicKey.toString(),
        signatureBase64,
        message
      );

      console.log('Frontend received API result:', result);

      if (result.success && result.data) {
        console.log('Processing successful result:', result.data);
        setStatus(prev => ({
          ...prev,
          hasAccess: result.data.hasAccess,
          tokenBalance: result.data.tokenBalance,
          sessionToken: result.data.sessionToken,
          isVerifying: false,
          error: result.data.hasAccess ? undefined : `Insufficient tokens. Required: ${result.data.requiredBalance}, Found: ${result.data.tokenBalance}`
        }));
        
        if (result.data.hasAccess) {
          toast.success('Token verification successful!');
          onAccessGranted?.(result.data.sessionToken);
        } else {
          toast.error(`Insufficient tokens. You need ${result.data.requiredBalance} tokens to access this feature.`);
          onAccessDenied?.();
        }
      } else {
        setStatus(prev => ({
          ...prev,
          hasAccess: false,
          isVerifying: false,
          error: result.error || 'Token verification failed'
        }));
        
        toast.error(result.error || 'Token verification failed');
        onAccessDenied?.();
      }

    } catch (error) {
      console.error('Error verifying token access:', error);
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        isVerifying: false,
        error: 'Failed to verify token access. Please try again.'
      }));
      
      toast.error('Failed to verify token access');
      onAccessDenied?.();
    }
  };

  useEffect(() => {
    checkTokenAccess();
  }, [connected, publicKey, requiredTokens]);

  if (!connected) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm ${className}`}>
        <Shield className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Connection Required</h3>
        <p className="text-gray-400 text-center mb-4">
          Please connect your Solana wallet to verify your token balance.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Coins className="w-4 h-4" />
          <span>Requires {requiredTokens} token minimum</span>
        </div>
      </div>
    );
  }

  if (status.isLoading || status.isVerifying) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-900/20 to-green-900/20 rounded-xl border border-purple-500/30 backdrop-blur-sm ${className}`}>
        <Loader2 className="w-16 h-16 text-purple-400 mb-4 animate-spin" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {status.isVerifying ? 'Verifying Token Access' : 'Checking Token Balance'}
        </h3>
        <p className="text-gray-400 text-center">
          {status.isVerifying 
            ? 'Signing transaction and verifying your token access...'
            : 'Checking your token balance on the Solana blockchain...'
          }
        </p>
      </div>
    );
  }

  if (!status.hasAccess) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-xl border border-red-500/30 backdrop-blur-sm ${className}`}>
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Verification Token Required</h3>
        <p className="text-gray-400 text-center mb-4">
          {status.error || `You need at least ${requiredTokens} verification token to access AI-enhanced image upload.`}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Coins className="w-4 h-4" />
          <span>Current Balance: {status.tokenBalance} tokens</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <RetryButton
            onRetry={checkTokenAccess}
            isLoading={status.isLoading}
            text="Retry Check"
            className="flex-1"
          />
          
          <a
            href="https://pump.fun/coin/B2Vecaeprrf9m3V7HAaKSFGSwoJiACCL1AKaSjc7pump"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Buy Token
          </a>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Need verification tokens? Get them on pump.fun to unlock AI image enhancement features.
        </p>
      </div>
    );
  }

  // If user has sufficient tokens but hasn't verified yet
  if (status.hasAccess && !status.sessionToken) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/30 backdrop-blur-sm ${className}`}>
        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Token Balance Verified</h3>
        <p className="text-gray-400 text-center mb-4">
          Great! You have {status.tokenBalance} verification tokens. Complete verification to access AI features.
        </p>
        
        <button
          onClick={verifyTokenAccess}
          disabled={status.isVerifying}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          {status.isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Verify Access
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          This will sign a message to verify your wallet ownership.
        </p>
      </div>
    );
  }

  // Full access granted with session token
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-medium">Access Granted</span>
        <span className="text-gray-400 text-sm ml-auto">
          Balance: {status.tokenBalance} tokens
        </span>
      </div>
      {children}
    </div>
  );
};