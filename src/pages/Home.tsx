import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, 
  Sparkles, 
  Zap, 
  Shield, 
  ArrowRight, 
  Image as ImageIcon, 
  Wallet, 
  DollarSign, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Users,
  TrendingUp,
  Target,
  Rocket,
  Twitter,
  MessageCircle,
  Globe,
  PieChart,
  Lock,
  Star,
  ChevronRight
} from 'lucide-react'
import Layout from '@/components/Layout'
import { motion } from 'framer-motion'

const logoUrl = '/4logo.svg'

export default function Home() {
  const navigate = useNavigate()

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-500/10"></div>
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Animated Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="w-32 h-48 md:w-40 md:h-60 lg:w-48 lg:h-72">
              <img 
                src={logoUrl}
                alt="四.fun Logo"
                className="w-full h-full animate-pulse object-contain"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(0, 255, 65, 0.3))'
                }}
              />
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-6"
          >
            HOLD THE{' '}
            <span className="text-green-400 animate-pulse">4</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            The legendary signal is now a movement. <span className="text-green-400 font-semibold">$四</span> is the community token fueling the{' '}
            <span className="text-green-400 font-semibold">four.meme</span> launchpad to global dominance.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <button
              onClick={() => navigate('/editor')}
              className="bg-gradient-to-r from-green-400 to-green-500 text-black px-8 py-4 rounded-full text-lg font-bold hover:shadow-lg hover:shadow-green-400/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Sparkles className="w-6 h-6" />
              <span>LAUNCH THE '4' AI GENERATOR</span>
            </button>
            
            <button
              onClick={() => window.open('https://four.meme', '_blank')}
              className="border-2 border-green-400 text-green-400 px-8 py-4 rounded-full text-lg font-bold hover:bg-green-400 hover:text-black transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <DollarSign className="w-6 h-6" />
              <span>BUY $四 ON FOUR.MEME</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Section 2: The Builder's Code */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2 
            {...fadeInUp}
            className="text-4xl md:text-6xl font-bold text-green-400 mb-8"
          >
            THE BUILDER'S CODE
          </motion.h2>
          
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8">
              In a world of Fear, Uncertainty, and Doubt (FUD), one symbol unites us. The '4', championed by CZ, is our commitment. 
              It means we ignore the noise. We focus on what matters. We build.
            </p>
            <p className="text-xl md:text-2xl text-green-400 font-semibold">
              $四 is the tokenization of this powerful ethos.
            </p>
          </motion.div>

          {/* Visual Elements */}
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="bg-black rounded-lg p-6 border border-green-400/30">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Ignore FUD</h3>
              <p className="text-gray-300">Stay strong against negativity and attacks</p>
            </div>
            <div className="bg-black rounded-lg p-6 border border-green-400/30">
              <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Stay Focused</h3>
              <p className="text-gray-300">Concentrate on what truly matters</p>
            </div>
            <div className="bg-black rounded-lg p-6 border border-green-400/30">
              <Rocket className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Keep Building</h3>
              <p className="text-gray-300">Never stop creating and improving</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Show Your 4 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-green-400 mb-8">
              SHOW YOUR 4
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Join the movement. Transform any photo into a legendary symbol of a true builder. 
              It's simple, fast, and ready to share.
            </p>
          </motion.div>

          {/* How it works */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            <motion.div variants={fadeInUp} className="text-center">
              <div className="bg-gradient-to-r from-green-400 to-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">1. Upload</h3>
              <p className="text-gray-300 text-lg">Choose your photo</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="bg-gradient-to-r from-green-400 to-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">2. Generate</h3>
              <p className="text-gray-300 text-lg">Our AI works its magic</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="bg-gradient-to-r from-green-400 to-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Twitter className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">3. Share</h3>
              <p className="text-gray-300 text-lg">Post directly to X with #ShowYour4</p>
            </motion.div>
          </motion.div>

          {/* CTA */}
          <motion.div {...fadeInUp} className="text-center">
            <button
              onClick={() => navigate('/editor')}
              className="bg-gradient-to-r from-green-400 to-green-500 text-black px-12 py-6 rounded-full text-xl font-bold hover:shadow-lg hover:shadow-green-400/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
            >
              <ImageIcon className="w-6 h-6" />
              <span>CREATE MY '4' PHOTO NOW</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Our Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-green-400 mb-8">
              ROCKET FUEL FOR FOUR.MEME
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
              Our purpose is clear and direct. <span className="text-green-400 font-semibold">$四</span> exists to support{' '}
              <span className="text-green-400 font-semibold">four.meme</span>. A portion of every transaction is dedicated to the{' '}
              <span className="text-green-400 font-semibold">four.meme</span> treasury, used for marketing, buybacks, and fueling its ecosystem.
            </p>
            <p className="text-xl text-green-400 font-bold">
              When four.meme wins, we all win.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            <motion.div variants={fadeInUp} className="bg-black rounded-lg p-8 border border-green-400/30">
              <Users className="w-12 h-12 text-green-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Community</h3>
              <p className="text-gray-300 text-lg">A massive, engaged army of builders</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-black rounded-lg p-8 border border-green-400/30">
              <TrendingUp className="w-12 h-12 text-green-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Hype</h3>
              <p className="text-gray-300 text-lg">A viral marketing engine through our AI utility</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-black rounded-lg p-8 border border-green-400/30">
              <DollarSign className="w-12 h-12 text-green-400 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Resources</h3>
              <p className="text-gray-300 text-lg">Direct financial support from our tokenomics</p>
            </motion.div>
          </motion.div>

          {/* CTA */}
          <motion.div {...fadeInUp} className="text-center">
            <button
              onClick={() => window.open('https://four.meme', '_blank')}
              className="border-2 border-green-400 text-green-400 px-12 py-6 rounded-full text-xl font-bold hover:bg-green-400 hover:text-black transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 mx-auto"
            >
              <ExternalLink className="w-6 h-6" />
              <span>VISIT FOUR.MEME</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Section 5: Tokenomics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-green-400 mb-8">
              $四 TOKENOMICS
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Tokenomics Details */}
            <motion.div {...fadeInUp} className="space-y-8">
              <div className="bg-black rounded-lg p-6 border border-green-400/30">
                <h3 className="text-2xl font-bold text-green-400 mb-4">Total Supply</h3>
                <p className="text-3xl font-bold text-white">444,444,444 $四</p>
              </div>

              <div className="bg-black rounded-lg p-6 border border-green-400/30">
                <h3 className="text-2xl font-bold text-green-400 mb-4">Launch</h3>
                <p className="text-lg text-gray-300">Fair launch on the four.meme bonding curve. No private sale.</p>
              </div>

              <div className="bg-black rounded-lg p-6 border border-green-400/30">
                <h3 className="text-2xl font-bold text-green-400 mb-4">Tax: 4% Buy / 4% Sell</h3>
                <div className="space-y-2 text-gray-300">
                  <p>• 1% → Liquidity Pool</p>
                  <p>• 1% → Marketing & Development</p>
                  <p>• 2% → four.meme Treasury Wallet</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black rounded-lg p-6 border border-green-400/30">
                  <Lock className="w-8 h-8 text-green-400 mb-2" />
                  <h4 className="text-lg font-bold text-white">Liquidity</h4>
                  <p className="text-gray-300">Locked for 4 years</p>
                </div>
                <div className="bg-black rounded-lg p-6 border border-green-400/30">
                  <Shield className="w-8 h-8 text-green-400 mb-2" />
                  <h4 className="text-lg font-bold text-white">Contract</h4>
                  <p className="text-gray-300">Renounced</p>
                </div>
              </div>
            </motion.div>

            {/* Visual Pie Chart Representation */}
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-green-500 p-1">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-white">444M</p>
                      <p className="text-green-400">$四 Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 6: Roadmap */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-green-400 mb-8">
              THE PATH FORWARD
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Phase 1 */}
            <motion.div {...fadeInUp} className="bg-black rounded-lg p-6 border border-green-400/30">
              <div className="flex items-center mb-4">
                <div className="bg-green-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</div>
                <h3 className="text-xl font-bold text-green-400">The Signal</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li>• $四 Token Launch on four.meme</li>
                <li>• Launch of AI Photo Generator v1</li>
                <li>• Viral #ShowYour4 Marketing Campaign</li>
                <li>• CoinGecko / CoinMarketCap Listings</li>
              </ul>
            </motion.div>

            {/* Phase 2 */}
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-black rounded-lg p-6 border border-green-400/30">
              <div className="flex items-center mb-4">
                <div className="bg-green-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</div>
                <h3 className="text-xl font-bold text-green-400">The Assembly</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li>• Community Building & Contests</li>
                <li>• Partnerships with Top BSC Influencers</li>
                <li>• First CEX Listing</li>
                <li>• AI Generator Upgrades (Filters, Styles)</li>
              </ul>
            </motion.div>

            {/* Phase 3 */}
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="bg-black rounded-lg p-6 border border-green-400/30">
              <div className="flex items-center mb-4">
                <div className="bg-green-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</div>
                <h3 className="text-xl font-bold text-green-400">The Engine</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li>• Integration with Telegram for in-app photo generation</li>
                <li>• Strategic support for the first 4 projects on four.meme</li>
                <li>• Major CEX Listings</li>
              </ul>
            </motion.div>

            {/* Phase 4 */}
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className="bg-black rounded-lg p-6 border border-green-400/30">
              <div className="flex items-center mb-4">
                <div className="bg-green-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">4</div>
                <h3 className="text-xl font-bold text-green-400">Global Dominance</h3>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li>• $四 becomes the universally recognized symbol for builders on BSC</li>
                <li>• four.meme is cemented as the #1 meme launchpad in the world</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <h3 className="text-3xl md:text-4xl font-bold text-green-400 mb-8">
              Join the Builders
            </h3>
            
            <div className="flex justify-center space-x-8 mb-8">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Twitter className="w-8 h-8" />
              </a>
              <a 
                href="https://telegram.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <MessageCircle className="w-8 h-8" />
              </a>
              <a 
                href="https://four.meme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Globe className="w-8 h-8" />
              </a>
            </div>
            
            <p className="text-gray-400">
              © 2025 四.fun | All Rights Reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </Layout>
  )
}