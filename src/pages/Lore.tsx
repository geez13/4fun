import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Globe, Users, Camera, ExternalLink, ChevronDown, X, Shield, Heart, Zap, Twitter } from 'lucide-react';
import BNBVSign from '@/components/BNBVSign';

// Types
interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  significance: string;
  sources: string[];
}

interface LoreImage {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  source: string;
  category: 'origin' | 'cultural' | 'meme' | 'philosophy';
}

// Timeline data for the "4" lore
const timelineEvents: TimelineEvent[] = [
  {
    id: 'cz-genesis-tweet',
    date: '2023-01-02',
    title: 'The Genesis Tweet',
    description: 'CZ tweets his 4 principles for 2023: Education, Compliance, Product & Service, and most importantly - "Ignore FUD, fake news, attacks, etc."',
    significance: 'Birth of the "4" philosophy in crypto culture',
    sources: ['Twitter/X', 'Binance Academy']
  },
  {
    id: 'first-4-response',
    date: '2023-03-27',
    title: 'First "4" Response',
    description: 'During the CFTC lawsuit against Binance, CZ responds with a simple "4" tweet, referencing his principle to ignore FUD and attacks.',
    significance: 'First major use of "4" as a response to adversity',
    sources: ['Twitter/X', 'Business Insider']
  },
  {
    id: 'community-adoption',
    date: '2023-04-15',
    title: 'Community Adoption',
    description: 'The crypto community begins using "4" as a symbol of resilience, adopting CZ\'s philosophy of ignoring negativity and focusing on building.',
    significance: 'Transformation from personal principle to community meme',
    sources: ['Crypto Twitter', 'Reddit Communities']
  },
  {
    id: 'cultural-phenomenon',
    date: '2023-12-01',
    title: 'Cultural Phenomenon',
    description: '"4" becomes a widely recognized symbol in crypto culture, representing strength, resilience, and the ability to rise above criticism.',
    significance: 'Evolution into a universal crypto cultural symbol',
    sources: ['Crypto Media', 'Social Platforms']
  }
];

// The 4 principles from CZ's original tweet
const fourPrinciples = [
  {
    number: '1',
    title: 'Education',
    description: 'Focus on educating users about crypto, blockchain technology, and financial literacy.',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600'
  },
  {
    number: '2',
    title: 'Compliance',
    description: 'Work with regulators and ensure proper compliance across all jurisdictions.',
    icon: Shield,
    color: 'from-green-500 to-green-600'
  },
  {
    number: '3',
    title: 'Product & Service',
    description: 'Continue building and improving products that serve the crypto community.',
    icon: Zap,
    color: 'from-purple-500 to-purple-600'
  },
  {
    number: '4',
    title: 'Ignore FUD, fake news, attacks, etc.',
    description: 'Stay focused on building and ignore the noise, negativity, and distractions.',
    icon: Heart,
    color: 'from-green-500 to-green-600'
  }
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

// Components
const TimelineItem: React.FC<{ event: TimelineEvent; index: number }> = ({ event, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      variants={fadeInUp}
      className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-8`}
    >
      <div className={`w-full max-w-md ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
        <div className="bg-black rounded-lg p-6 shadow-lg border border-slate-700 hover:border-green-400 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 text-sm font-semibold">{event.date}</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
          <p className="text-slate-300 mb-3">{event.description}</p>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-600 pt-3 mt-3"
              >
                <p className="text-slate-400 text-sm mb-2">
                  <strong>Significance:</strong> {event.significance}
                </p>
                <div className="text-slate-400 text-xs">
                  <strong>Sources:</strong> {event.sources.join(', ')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Timeline line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-400 to-green-500"></div>
      
      {/* Timeline dot */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-8 w-4 h-4 bg-green-400 rounded-full border-4 border-black"></div>
    </motion.div>
  );
};

const PrincipleCard: React.FC<{ principle: typeof fourPrinciples[0]; index: number }> = ({ principle, index }) => {
  const Icon = principle.icon;
  
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05 }}
      className="bg-black rounded-lg p-6 border border-slate-700 hover:border-green-400 transition-all duration-300">
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${principle.color} flex items-center justify-center mr-4`}>
          <span className="text-white font-bold text-xl">{principle.number}</span>
        </div>
        <Icon className="w-6 h-6 text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{principle.title}</h3>
      <p className="text-slate-300">{principle.description}</p>
    </motion.div>
  );
};

const Lore: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<LoreImage | null>(null);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sample lore images
  const loreImages: LoreImage[] = [
    {
      id: 'cz-original-tweet',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=CZ%20Binance%20CEO%20making%20number%204%20hand%20gesture%20professional%20portrait%20crypto%20leader%20confident%20expression&image_size=landscape_4_3',
      title: 'CZ and the Number 4',
      description: 'The visionary behind the "4" philosophy that became a crypto cultural phenomenon.',
      date: '2023',
      source: 'Binance',
      category: 'origin'
    },
    {
      id: 'four-meme-culture',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=crypto%20community%20memes%20number%204%20symbol%20digital%20art%20binance%20yellow%20black%20resilience%20strength&image_size=square',
      title: 'The 4 Meme Culture',
      description: 'How the crypto community embraced "4" as a symbol of resilience and strength.',
      date: '2023-Present',
      source: 'Crypto Twitter',
      category: 'cultural'
    },
    {
      id: 'philosophy-visualization',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20visualization%20ignore%20FUD%20concept%20rising%20above%20negativity%20golden%20light%20crypto%20philosophy&image_size=landscape_4_3',
      title: 'Philosophy of Resilience',
      description: 'Visual representation of the core philosophy: rising above FUD and staying focused.',
      date: '2023',
      source: 'Community Art',
      category: 'philosophy'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mb-6 flex justify-center"
          >
            <div className="text-8xl md:text-9xl font-bold text-green-400">4</div>
          </motion.div>
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent"
          >
            The Lore of 4
          </motion.h1>
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-slate-300 mb-8"
          >
            From CZ's Philosophy to Crypto Culture Symbol
          </motion.p>
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => scrollToSection('genesis')}
            className="bg-gradient-to-r from-green-400 to-green-500 text-black px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:shadow-green-400/25 transition-all duration-300"
          >
            Discover the Origin
          </motion.button>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-white rounded-full mt-2"
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex justify-center space-x-8">
            {[
              { id: 'genesis', label: 'Genesis', icon: Clock },
              { id: 'principles', label: 'Principles', icon: BookOpen },
              { id: 'timeline', label: 'Timeline', icon: Users },
              { id: 'philosophy', label: 'Philosophy', icon: Globe },
              { id: 'gallery', label: 'Gallery', icon: Camera }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="flex items-center space-x-2 text-slate-300 hover:text-green-400 transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Genesis Section */}
      <motion.section
        id="genesis"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Genesis</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              On January 2, 2023, CZ shared his vision for keeping things simple in the new year
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-4 text-green-400">The Original Tweet</h3>
          <div className="bg-black rounded-lg p-6 border-l-4 border-green-400">
                <div className="flex items-start space-x-3 mb-4">
                  <Twitter className="w-6 h-6 text-blue-400 mt-1" />
                  <div>
                    <p className="text-white font-semibold">@cz_binance</p>
                    <p className="text-slate-400 text-sm">January 2, 2023</p>
                  </div>
                </div>
                <p className="text-slate-300 mb-4 italic">
                  "Will try to keep 2023 simple. Spend more time on less things."
                </p>
                <p className="text-slate-300 mb-2">
                  CZ then outlined his 4 principles for 2023:
                </p>
                <div className="space-y-1 text-slate-300 mb-4">
                  <p>1. Education</p>
                  <p>2. Compliance</p>
                  <p>3. Product & Service</p>
                  <p className="text-green-400 font-semibold">4. Ignore FUD, fake news, attacks, etc.</p>
                </div>
                <p className="text-slate-300 text-sm">
                  "In the future, would appreciate if you can link to this post when I tweet '4'. 🙏"
                </p>
              </div>
              <div className="mt-4">
                <a 
                  href="https://x.com/cz_binance/status/1631579936531292160" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original Tweet
                </a>
              </div>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-4 text-green-400">The Philosophy Born</h3>
              <p className="text-slate-300 mb-6">
                What started as a simple New Year's resolution became a powerful philosophy that 
                resonated throughout the crypto community. The idea of focusing on building while 
                ignoring negativity struck a chord with builders, traders, and believers alike.
              </p>
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                  <p className="text-green-400 text-sm">
                  <strong>Cultural Impact:</strong> CZ asked his followers to "link back to this tweet 
                  when he tweets '4' in the future," unknowingly creating what would become a crypto meme.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* The 4 Principles Section */}
      <motion.section
        id="principles"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 bg-black"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Four Principles</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              CZ's blueprint for success in crypto and beyond
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {fourPrinciples.map((principle, index) => (
              <PrincipleCard key={principle.number} principle={principle} index={index} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Timeline Section */}
      <motion.section
        id="timeline"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Journey of "4"</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              How a simple principle evolved into a cultural phenomenon
            </p>
          </motion.div>
          
          <div className="relative">
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Philosophy Section */}
      <motion.section
        id="philosophy"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 bg-black"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Philosophy of "4"</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              More than a meme - a way of life in the crypto space
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp} className="bg-black rounded-lg p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-3 text-green-400">Resilience</h3>
              <p className="text-slate-300">
                "4" represents the ability to stay strong in the face of criticism, market volatility, and external attacks.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-black rounded-lg p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-green-400">Focus</h3>
              <p className="text-slate-300">
                By ignoring noise and distractions, builders can concentrate on what truly matters - creating value.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-black rounded-lg p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3 text-green-400">Growth</h3>
              <p className="text-slate-300">
                The philosophy encourages continuous building and improvement rather than getting caught up in drama.
              </p>
            </motion.div>
          </div>
          
          <motion.div variants={fadeInUp} className="mt-12 bg-gradient-to-r from-green-400/10 to-green-500/10 border border-green-400/30 rounded-lg p-8">
            <h4 className="text-2xl font-bold text-green-400 mb-4">The Cultural Impact</h4>
            <p className="text-slate-300 mb-4">
              "4" has transcended its origins to become a rallying cry for the crypto community. When markets crash, 
              when FUD spreads, when attacks come - the community responds with "4", reminding everyone to stay 
              focused on building the future of finance.
            </p>
            <p className="text-slate-300">
              It's not just about ignoring negativity - it's about choosing to focus your energy on positive, 
              constructive actions that move the entire ecosystem forward.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Gallery Section */}
      <motion.section
        id="gallery"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Gallery of "4"</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Visual representations of the philosophy that changed crypto culture
            </p>
          </motion.div>
          
          <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {loreImages.map((image) => (
              <motion.div
                key={image.id}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer bg-black rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                 onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-white mb-2">{image.title}</h3>
                  <p className="text-slate-400 text-sm mb-2">{image.description}</p>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{image.date}</span>
                    <span>{image.source}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Legacy Section */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 bg-black"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Legacy of "4"</h2>
            <p className="text-xl text-slate-300">
              How a simple principle became a movement
            </p>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="bg-black rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6 text-green-400">Impact & Attribution</h3>
            <div className="grid md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h4 className="font-semibold mb-2">Cultural Sources</h4>
                <ul className="space-y-1 text-sm">
                  <li>• CZ's Original Tweet (Jan 2, 2023)</li>
                  <li>• Binance Academy Documentation</li>
                  <li>• Crypto Twitter Community</li>
                  <li>• Business & Financial Media</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Community Impact</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Meme Culture Evolution</li>
                  <li>• Philosophy Adoption</li>
                  <li>• Resilience Symbol</li>
                  <li>• Builder Mindset</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-600">
              <p className="text-sm text-slate-400">
                <strong>Note:</strong> This lore page celebrates the cultural phenomenon of "4" in crypto. 
                The philosophy represents the community's commitment to building despite adversity. 
                All content is based on publicly available information and community observations.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-4xl max-h-full bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 text-white hover:text-green-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{selectedImage.title}</h3>
                <p className="text-slate-300 mb-2">{selectedImage.description}</p>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>{selectedImage.date}</span>
                  <span>Source: {selectedImage.source}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lore;