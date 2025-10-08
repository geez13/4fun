import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Coins } from 'lucide-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletConnectorProps {
  className?: string;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ className = '' }) => {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  const fetchSolBalance = async () => {
    if (!connected || !publicKey) {
      setSolBalance(0);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      setSolBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchSolBalance();
  }, [connected, publicKey, connection]);

  if (connected && publicKey) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-solana-primary/20 to-solana-secondary/20 rounded-lg border border-solana-primary/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-solana-primary" />
            <span className="text-sm font-medium text-white">
              {formatAddress(publicKey.toString())}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-600"></div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-solana-secondary" />
            <span className="text-sm font-medium text-white">
              {isLoadingBalance ? '...' : `${formatBalance(solBalance)} SOL`}
            </span>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <WalletMultiButton 
        className="!bg-gradient-to-r !from-solana-primary !to-solana-secondary hover:!from-solana-primary/80 hover:!to-solana-secondary/80 !border-0 !rounded-lg !px-4 !py-2 !text-sm !font-medium !text-white !transition-all !duration-200 !shadow-lg hover:!shadow-xl"
      />
    </div>
  );
};