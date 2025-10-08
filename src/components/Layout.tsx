import React from 'react'
import { Link } from 'react-router-dom'
import { Image, Home, Images, BookOpen, Grid3X3 } from 'lucide-react'
import { WalletConnector } from '@/components/WalletConnector'
import { useWallet } from '@solana/wallet-adapter-react'
import vsignLogoUrl from '@/assets/vsignlogo.svg'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-dark-gradient">
      {/* Navigation */}
      <nav className="bg-gradient-to-b from-transparent via-dark-900/20 to-transparent backdrop-blur-sm border-b border-dark-700/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={vsignLogoUrl} 
                alt="✌️-Sign PFP-Gen Logo" 
                className="w-8 h-8"
              />
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center space-x-1 text-gray-300 hover:text-solana-primary transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/editor"
                className="flex items-center space-x-1 text-gray-300 hover:text-solana-primary transition-colors"
              >
                <Image className="w-4 h-4" />
                <span>Editor</span>
              </Link>
              <Link
                to="/vwall"
                className="flex items-center space-x-1 text-gray-300 hover:text-solana-primary transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                <span>V Wall</span>
              </Link>
              <Link
                to="/history"
                className="flex items-center space-x-1 text-gray-300 hover:text-solana-primary transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>History</span>
              </Link>

            </div>

            {/* Wallet Connection */}
            <div className="flex items-center">
              <WalletConnector />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark-800/90 backdrop-blur-md border-t border-dark-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">&copy; 2024 ✌️-Sign PFP-Gen. Powered by Advanced AI Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}