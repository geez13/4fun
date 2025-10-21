import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Image, Home, Images, BookOpen, Grid3X3, Twitter, Send } from 'lucide-react'
import { WalletConnector } from '@/components/WalletConnector'
import { useAccount } from 'wagmi'

const logoUrl = '/4logo.svg'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isConnected } = useAccount()
  const location = useLocation()

  const socialLinks = {
    x: 'https://x.com/fourfun_meme',
    telegram: 'https://t.me/fourfun_meme',
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gradient-to-b from-transparent via-dark-900/20 to-transparent backdrop-blur-sm border-b border-dark-700/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={logoUrl} 
                alt="Four.fun Logo" 
                className="w-8 h-8"
              />
            </Link>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center space-x-1 text-gray-300 hover:text-binance-primary transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/editor"
                className="flex items-center space-x-1 text-gray-300 hover:text-binance-primary transition-colors"
              >
                <Image className="w-4 h-4" />
                <span>Editor</span>
              </Link>
              <Link
                to="/fourmovement"
                className="flex items-center space-x-1 text-gray-300 hover:text-binance-primary transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                <span>4 Movement</span>
              </Link>
              <Link
                to="/lore"
                className="flex items-center space-x-1 text-gray-300 hover:text-binance-primary transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Lore</span>
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
      <footer className="bg-black backdrop-blur-md border-t border-dark-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {location.pathname === '/' ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">© 2024 四-Sign PFP-Gen. Powered by Advanced 四.fun Technology.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={socialLinks.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our X (Twitter) profile"
                  className="inline-flex items-center gap-2 rounded-md border border-dark-700 bg-dark-900/40 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span className="text-sm">X</span>
                </a>
                <a
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join our Telegram"
                  className="inline-flex items-center gap-2 rounded-md border border-dark-700 bg-dark-900/40 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span className="text-sm">Telegram</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm">© 2025 四.fun. Powered by Advanced 四.fun Technology.</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}