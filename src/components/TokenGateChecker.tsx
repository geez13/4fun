import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink, Coins, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { bsc, bscTestnet } from 'wagmi/chains';
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
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const [status, setStatus] = useState<TokenGateStatus>({
    isLoading: true,
    hasAccess: false,
    tokenBalance: 0,
    isVerifying: false
  });

  // Check if user is on the correct network (BSC)
  const isCorrectNetwork = chainId === bsc.id || chainId === bscTestnet.id;
  const currentNetwork = chainId === bsc.id ? 'BSC Mainnet' : chainId === bscTestnet.id ? 'BSC Testnet' : 'Unknown';

  const checkTokenAccess = async () => {
    if (!isConnected || !address) {
      setStatus({ isLoading: false, hasAccess: false, tokenBalance: 0, isVerifying: false });
      return;
    }

    // Check network first
    if (!isCorrectNetwork) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        hasAccess: false,
        isVerifying: false,
        error: `Please switch to BNB Chain. Currently on: ${currentNetwork}`
      }));
      return;
    }

    // Start verification immediately when wallet is connected
    await verifyTokenAccess();
  };

  const verifyTokenAccess = async () => {
    if (!isConnected || !address) {
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        isVerifying: false,
        error: 'Wallet not connected'
      }));
      return;
    }

    // Check network
    if (!isCorrectNetwork) {
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        isVerifying: false,
        error: `Please switch to BNB Chain. Currently on: ${currentNetwork}`
      }));
      toast.error(`Please switch to BNB Chain. Currently on: ${currentNetwork}`);
      return;
    }

    if (!signMessageAsync) {
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        isVerifying: false,
        error: 'Wallet does not support message signing'
      }));
      toast.error('Wallet does not support message signing');
      return;
    }

    setStatus(prev => ({ ...prev, isVerifying: true, error: undefined }));

    try {
      // Create verification message
      const message = `Verify token access for 4-Finger Magic\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      
      // Sign the message with better error handling
      let signature: string;
      try {
        signature = await signMessageAsync({ 
          message,
          account: address
        });
      } catch (signError: any) {
        console.error('Message signing failed:', signError);
        
        // Handle specific wallet errors with more detailed error checking
        let errorMessage = 'Failed to sign message. Please try again or check your wallet connection.';
        
        // Check for user rejection errors
        if (signError?.name === 'UserRejectedRequestError' || 
            signError?.message?.includes('User rejected') ||
            signError?.message?.includes('user rejected') ||
            signError?.message?.includes('User denied') ||
            signError?.code === 4001) {
          errorMessage = 'Message signing was cancelled. Please try again to verify your token access.';
          toast.info('Please approve the message signing request in your wallet to continue.');
        } 
        // Check for network errors
        else if (signError?.message?.includes('network') || 
                 signError?.message?.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } 
          // Check for connector/wallet connection errors
          else if (signError?.message?.includes('connector') || 
                   signError?.message?.includes('getChainId') ||
                   signError?.message?.includes('connection') ||
                   signError?.message?.includes('not a function')) {
            // Attempt a direct wallet signing fallback to avoid connector chainId issues
            if (typeof window !== 'undefined' && (window as any)?.ethereum) {
            try {
              signature = await (window as any).ethereum.request({
                method: 'personal_sign',
                params: [message, address]
              });
              errorMessage = '';
            } catch (fallbackError: any) {
              console.error('Fallback personal_sign failed:', fallbackError);
              errorMessage = 'Wallet connection error. Please reconnect your wallet and try again.';
              toast.error('Please reconnect your wallet and try again.');
            }
            } else {
              errorMessage = 'Wallet connection error. Please reconnect your wallet and try again.';
              toast.error('Please reconnect your wallet and try again.');
            }
          }
        // Check for chain/network mismatch
        else if (signError?.message?.includes('chain') || 
                 signError?.message?.includes('Chain')) {
          errorMessage = 'Please ensure you are connected to the correct network (BNB Chain).';
        }
        
        throw new Error(errorMessage);
      }
          // Safety check: ensure we have a valid signature even if no error was thrown
          if (!signature) {
            throw new Error('Signature was not obtained. Please approve the signing request in your wallet and try again.');
          }
      // Send verification request to backend using API service
      const result = await apiService.verifyTokenAccess(
        address,
        signature,
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

    } catch (error: any) {
      console.error('Error verifying token access:', error);
      setStatus(prev => ({
        ...prev,
        hasAccess: false,
        isVerifying: false,
        error: error.message || 'Failed to verify token access. Please try again.'
      }));
      
      toast.error(error.message || 'Failed to verify token access');
      onAccessDenied?.();
    }
  };

  useEffect(() => {
    checkTokenAccess();
  }, [isConnected, address, requiredTokens, chainId]);

  if (!isConnected) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm ${className}`}>
        <Shield className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Connection Required</h3>
        <p className="text-gray-400 text-center mb-4">
          Please connect your BNB Chain wallet to verify your token balance.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Coins className="w-4 h-4" />
          <span>Requires {requiredTokens} "4" token minimum</span>
        </div>
      </div>
    );
  }

  // Show network warning if on wrong network
  if (!isCorrectNetwork) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl border border-orange-500/30 backdrop-blur-sm ${className}`}>
        <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wrong Network</h3>
        <p className="text-gray-400 text-center mb-4">
          Please switch to BNB Chain to verify your "4" token balance.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Currently on: {currentNetwork}</span>
        </div>
        
        <RetryButton
          onRetry={checkTokenAccess}
          isLoading={status.isLoading}
          text="Check Again"
          className="w-full max-w-sm"
        />
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Switch to BNB Chain in your wallet and click "Check Again"
        </p>
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
            : 'Checking your token balance on the BNB Chain...'
          }
        </p>
      </div>
    );
  }

  if (!status.hasAccess) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-xl border border-red-500/30 backdrop-blur-sm ${className}`}>
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">"4" Token Required</h3>
        <p className="text-gray-400 text-center mb-4">
          {status.error || `You need at least ${requiredTokens} "4" token to access AI-enhanced image upload.`}
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
            href="https://pancakeswap.finance/swap?outputCurrency=0x0a43fc31a73013089df59194872ecae4cae14444"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Buy "4" Token
          </a>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Need "4" tokens? Get them on PancakeSwap to unlock AI image enhancement features.
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
          Great! You have {status.tokenBalance} "4" tokens. Complete verification to access AI features.
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

  // Success state - user has access and session token
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
};
