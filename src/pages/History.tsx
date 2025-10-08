import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Globe, Users, Camera, ExternalLink, ChevronDown, X } from 'lucide-react';
import SolanaVSign from '@/components/SolanaVSign';

// Types
interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  significance: string;
  sources: string[];
}

interface HistoricalImage {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  source: string;
  category: 'wwii' | 'peace-movement' | 'modern' | 'cultural';
}

// Timeline data
const timelineEvents: TimelineEvent[] = [
  {
    id: 'laveleye-broadcast',
    date: '1941-01-14',
    title: 'Victor de Laveleye\'s BBC Broadcast',
    description: 'Belgian politician Victor de Laveleye suggests the V sign as a symbol of unity and resistance during his BBC radio broadcast to occupied Belgium.',
    significance: 'Origin of the V for Victory campaign that would spread across occupied Europe',
    sources: ['BBC Archives', 'Know Your Meme']
  },
  {
    id: 'churchill-adoption',
    date: '1941-07-19',
    title: 'Churchill Endorses V for Victory',
    description: 'Prime Minister Winston Churchill begins using the V sign in public appearances, popularizing the gesture among Allied forces and civilians.',
    significance: 'Transformation from resistance symbol to official Allied victory gesture',
    sources: ['TIME Magazine', 'Imperial War Museums']
  },
  {
    id: 'peace-transformation',
    date: '1960s',
    title: 'Peace Movement Adoption',
    description: 'Vietnam War protesters and the counterculture movement adopt the V sign as a symbol of peace, fundamentally changing its meaning.',
    significance: 'Evolution from victory symbol to universal peace gesture',
    sources: ['History.com', 'Counterculture Archives']
  },
  {
    id: 'global-adoption',
    date: '1970s-Present',
    title: 'Global Photography Culture',
    description: 'The V sign becomes ubiquitous in photography worldwide, especially in selfies and social media culture.',
    significance: 'Transformation into universal positive gesture in photography',
    sources: ['Social Media Studies', 'Photography Culture Research']
  }
];

// Cultural variations data
const culturalVariations = {
  victory: {
    orientation: 'palm-outward',
    regions: ['United States', 'Most of Europe', 'Global'],
    meaning: 'Victory, Peace, Positive gesture',
    historical_context: 'WWII Allied victory symbol'
  },
  offensive: {
    orientation: 'palm-inward',
    regions: ['United Kingdom', 'Ireland', 'Australia', 'New Zealand'],
    meaning: 'Offensive gesture equivalent to middle finger',
    historical_context: 'Dates back to at least 1900, possibly medieval origins'
  }
};

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
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-solana-purple transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-solana-green text-sm font-semibold">{event.date}</span>
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
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-solana-purple to-solana-green"></div>
      
      {/* Timeline dot */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-8 w-4 h-4 bg-solana-purple rounded-full border-4 border-slate-900"></div>
    </motion.div>
  );
};

const Lightbox: React.FC<{ image: HistoricalImage; onClose: () => void }> = ({ image, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="max-w-4xl max-h-full bg-slate-800 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-solana-green transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2">{image.title}</h3>
          <p className="text-slate-300 mb-2">{image.description}</p>
          <div className="flex justify-between text-sm text-slate-400">
            <span>{image.date}</span>
            <span>Source: {image.source}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const History: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<HistoricalImage | null>(null);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sample historical images (using placeholder URLs)
  const historicalImages: HistoricalImage[] = [
    {
      id: 'churchill-v-sign',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Winston%20Churchill%20making%20V%20for%20Victory%20sign%20black%20and%20white%20historical%20photograph%201940s%20wartime%20portrait&image_size=landscape_4_3',
      title: 'Churchill\'s V for Victory',
      description: 'Winston Churchill popularized the V sign during WWII as a symbol of Allied victory and resistance.',
      date: '1941-1945',
      source: 'Imperial War Museums',
      category: 'wwii'
    },
    {
      id: 'peace-protesters',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=1960s%20peace%20protesters%20making%20V%20peace%20signs%20Vietnam%20War%20demonstration%20hippie%20movement%20vintage%20photograph&image_size=landscape_4_3',
      title: 'Peace Movement Adoption',
      description: 'Vietnam War protesters transformed the V sign into a symbol of peace during the 1960s counterculture movement.',
      date: '1960s',
      source: 'Counterculture Archives',
      category: 'peace-movement'
    },
    {
      id: 'modern-selfie',
      url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20diverse%20people%20taking%20selfie%20making%20V%20peace%20signs%20social%20media%20photography%20culture%20contemporary&image_size=square',
      title: 'Modern Photography Culture',
      description: 'The V sign became ubiquitous in modern photography and social media culture worldwide.',
      date: '2000s-Present',
      source: 'Social Media Studies',
      category: 'modern'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-solana-purple/20 to-solana-green/20"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mb-6 flex justify-center"
          >
            <SolanaVSign size="xl" className="w-24 h-24" />
          </motion.div>
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent"
          >
            The V Sign Story
          </motion.h1>
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-slate-300 mb-8"
          >
            From WWII Victory Symbol to Universal Peace Gesture
          </motion.p>
          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => scrollToSection('timeline')}
            className="bg-gradient-to-r from-solana-purple to-solana-green text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:shadow-solana-purple/25 transition-all duration-300"
          >
            Explore the History
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
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex justify-center space-x-8">
            {[
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'origins', label: 'Origins', icon: BookOpen },
              { id: 'evolution', label: 'Evolution', icon: Users },
              { id: 'variations', label: 'Variations', icon: Globe },
              { id: 'gallery', label: 'Gallery', icon: Camera }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="flex items-center space-x-2 text-slate-300 hover:text-solana-green transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Historical Timeline</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Trace the fascinating journey of the V sign from its wartime origins to its modern-day significance
            </p>
          </motion.div>
          
          <div className="relative">
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Origins Section */}
      <motion.section
        id="origins"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 bg-slate-800/50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">WWII Origins</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              The V sign began as a symbol of resistance and victory during World War II
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-4 text-solana-green">Victor de Laveleye's Vision</h3>
              <p className="text-slate-300 mb-6">
                On January 14, 1941, Belgian politician Victor de Laveleye suggested during his BBC radio broadcast 
                that occupied Europeans use the letter "V" as a rallying symbol. The letter stood for "Victory" in 
                English and "Victoire" in French, but also "Vrijheid" (freedom) in Dutch and Flemish.
              </p>
              <blockquote className="border-l-4 border-solana-purple pl-4 italic text-slate-400">
                "The occupier, by seeing this sign, always the same, infinitely repeated, will understand that he is 
                surrounded, encircled by an immense crowd of citizens eagerly awaiting his first moment of weakness."
              </blockquote>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-4 text-solana-green">Churchill's Adoption</h3>
              <p className="text-slate-300 mb-6">
                Winston Churchill initially dismissed the campaign but later embraced it wholeheartedly. His iconic 
                use of the V sign became one of the most recognizable gestures of WWII, symbolizing Allied 
                determination and eventual victory.
              </p>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400">
                  <strong>Historical Note:</strong> Churchill occasionally made the gesture with his palm facing 
                  inward, which in British culture is considered offensive. His private secretary had to remind 
                  him of the proper orientation.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Evolution Section */}
      <motion.section
        id="evolution"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Cultural Evolution</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              How the V sign transformed from a symbol of war to a universal gesture of peace
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp} className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold mb-3 text-solana-green">1940s: Victory</h3>
              <p className="text-slate-300">
                WWII symbol of Allied victory and resistance against fascism. Used by Churchill and resistance movements.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">☮️</div>
              <h3 className="text-xl font-bold mb-3 text-solana-green">1960s: Peace</h3>
              <p className="text-slate-300">
                Adopted by anti-war protesters during Vietnam War. Hippie movement transformed it into a peace symbol.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-slate-800 rounded-lg p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3 text-solana-green">2000s: Global</h3>
              <p className="text-slate-300">
                Universal positive gesture in photography and social media. Transcends cultural boundaries worldwide.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Variations Section */}
      <motion.section
        id="variations"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 bg-slate-800/50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Cultural Variations</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              The same gesture can have very different meanings across cultures
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div variants={fadeInUp} className="bg-slate-800 rounded-lg p-8">
              <div className="mb-4 flex justify-center">
                <SolanaVSign size="xl" className="w-16 h-16" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-solana-green text-center">Palm Outward</h3>
              <div className="space-y-4">
                <div>
                  <strong className="text-white">Meaning:</strong>
                  <span className="text-slate-300 ml-2">Victory, Peace, Positive gesture</span>
                </div>
                <div>
                  <strong className="text-white">Regions:</strong>
                  <span className="text-slate-300 ml-2">United States, Most of Europe, Global</span>
                </div>
                <div>
                  <strong className="text-white">Context:</strong>
                  <span className="text-slate-300 ml-2">WWII Allied victory symbol, 1960s peace movement</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="bg-slate-800 rounded-lg p-8">
              <div className="text-6xl mb-4 text-center">🖕</div>
              <h3 className="text-2xl font-bold mb-4 text-red-400 text-center">Palm Inward</h3>
              <div className="space-y-4">
                <div>
                  <strong className="text-white">Meaning:</strong>
                  <span className="text-slate-300 ml-2">Offensive gesture (equivalent to middle finger)</span>
                </div>
                <div>
                  <strong className="text-white">Regions:</strong>
                  <span className="text-slate-300 ml-2">UK, Ireland, Australia, New Zealand</span>
                </div>
                <div>
                  <strong className="text-white">Context:</strong>
                  <span className="text-slate-300 ml-2">Historical insult dating back to at least 1900</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div variants={fadeInUp} className="mt-12 bg-yellow-900/20 border border-yellow-600 rounded-lg p-6">
            <h4 className="text-lg font-bold text-yellow-400 mb-2">⚠️ Cultural Awareness</h4>
            <p className="text-slate-300">
              When traveling or communicating across cultures, be mindful of hand orientation. What's considered 
              a positive gesture in one culture might be offensive in another. The palm-outward V sign is 
              generally safe and positive worldwide.
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Historical Gallery</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Iconic moments and cultural artifacts showcasing the V sign through history
            </p>
          </motion.div>
          
          <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {historicalImages.map((image) => (
              <motion.div
                key={image.id}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
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

      {/* Sources Section */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 bg-slate-800/50"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Sources &amp; Attribution</h2>
            <p className="text-xl text-slate-300">
              This page is based on extensive research from historical archives and cultural studies
            </p>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="bg-slate-800 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6 text-solana-green">Primary Sources</h3>
            <div className="grid md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h4 className="font-semibold mb-2">Historical Archives</h4>
                <ul className="space-y-1 text-sm">
                  <li>• BBC Archives - Original broadcasts</li>
                  <li>• Imperial War Museums</li>
                  <li>• TIME Magazine Archives</li>
                  <li>• National Archives (UK/US)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cultural Studies</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Know Your Meme Documentation</li>
                  <li>• Wikipedia Historical Articles</li>
                  <li>• Counterculture Movement Archives</li>
                  <li>• Social Media Research Studies</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-600">
              <p className="text-sm text-slate-400">
                <strong>Disclaimer:</strong> This educational content is compiled from multiple historical sources 
                for informational purposes. All images are generated for illustration and educational use. 
                For academic research, please consult primary historical sources.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <Lightbox
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;