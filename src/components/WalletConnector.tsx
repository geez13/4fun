import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, LogOut, Coins, AlertTriangle } from 'lucide-react';
import { bsc, bscTestnet } from 'wagmi/chains';
import { formatEther } from 'viem';

interface WalletConnectorProps {
  className?: string;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ className = '' }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);

  // Get BNB balance
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4);
  };

  // Check if user is on the correct network (BSC)
  const isCorrectNetwork = chainId === bsc.id || chainId === bscTestnet.id;
  const currentNetwork = chainId === bsc.id ? 'BSC Mainnet' : chainId === bscTestnet.id ? 'BSC Testnet' : 'Unknown';

  const handleNetworkSwitch = () => {
    // Switch to BSC mainnet by default
    switchChain({ chainId: bsc.id });
  };

  useEffect(() => {
    setIsLoadingBalance(balanceLoading);
  }, [balanceLoading]);

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Network Warning */}
        {!isCorrectNetwork && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">Wrong Network</span>
            <button
              onClick={handleNetworkSwitch}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
            >
              Switch to BSC
            </button>
          </div>
        )}

        {/* Wallet Info */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-binance-primary/20 to-binance-secondary/20 rounded-lg border border-binance-primary/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-binance-primary" />
            <span className="text-sm font-medium text-white">
              {formatAddress(address)}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-600"></div>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-binance-primary" />
            <span className="text-sm font-medium text-white">
              {isLoadingBalance ? '...' : balance ? `${formatBalance(formatEther(balance.value))} BNB` : '0.0000 BNB'}
            </span>
          </div>
          {isCorrectNetwork && (
            <>
              <div className="h-4 w-px bg-gray-600"></div>
              <span className="text-xs text-gray-400">{currentNetwork}</span>
            </>
          )}
        </div>

        {/* Disconnect Button */}
        <button
          onClick={() => disconnect()}
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
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-gradient-to-r from-binance-primary to-binance-secondary hover:from-binance-primary/80 hover:to-binance-secondary/80 border-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-red-500 hover:bg-red-600 border-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={openChainModal}
                      style={{ display: 'flex', alignItems: 'center' }}
                      type="button"
                      className="bg-gray-700 hover:bg-gray-600 border-0 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all duration-200"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-gradient-to-r from-binance-primary to-binance-secondary hover:from-binance-primary/80 hover:to-binance-secondary/80 border-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};