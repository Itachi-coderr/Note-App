import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FileText, Users, Share2, Image as ImageIcon, ArrowRight, Lock, Edit3, Shield, Zap, Clock, Globe, BarChart, ArrowUp } from 'lucide-react';
import Footer from '../components/Footer';

const features = [
  {
    id: 1,
    title: 'Real-time Collaboration',
    icon: <Users className="w-8 h-8 text-indigo-500" />,
    description: 'Work together seamlessly in real-time',
    subFeatures: [
      'See who is currently editing',
      'Live cursor tracking',
      'Instant updates across devices',
      'Lock documents when needed'
    ]
  },
  {
    id: 2,
    title: 'Rich Text Editor',
    icon: <Edit3 className="w-8 h-8 text-purple-500" />,
    description: 'Powerful formatting tools at your fingertips',
    subFeatures: [
      'Text formatting (Bold, Italic, etc.)',
      'Lists and bullet points',
      'Insert images and links',
      'Multiple document templates'
    ]
  },
  {
    id: 3,
    title: 'Secure Sharing',
    icon: <Share2 className="w-8 h-8 text-green-500" />,
    description: 'Share your notes securely with others',
    subFeatures: [
      'Granular permission controls',
      'Secure document sharing',
      'View and edit access management',
      'Real-time collaboration controls'
    ]
  }
];

const howItWorks = [
  {
    step: 1,
    title: 'Create & Edit',
    description: 'Start by creating a new document or choose from our templates. Use our rich text editor to format your content, add images, and organize your notes.',
    icon: <FileText className="w-8 h-8 text-indigo-500" />
  },
  {
    step: 2,
    title: 'Collaborate',
    description: 'Invite team members to work together in real-time. See who is editing, track changes, and communicate through comments.',
    icon: <Users className="w-8 h-8 text-purple-500" />
  },
  {
    step: 3,
    title: 'Share & Secure',
    description: 'Share your documents with specific people or teams. Control who can view, edit, or comment on your notes.',
    icon: <Share2 className="w-8 h-8 text-pink-500" />
  }
];

const Home = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-white/10 backdrop-blur-3xl transform skew-x-12" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Collaborative Note Taking
                <br />
                <span className="text-indigo-200">Reimagined</span>
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto">
                Create, collaborate, and share notes in real-time. Experience the future of document editing with our powerful features.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold shadow-lg hover:bg-indigo-50 transition-colors"
                  >
                    Get Started <ArrowRight className="ml-2" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Collaboration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, edit, and share documents with your team in real-time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="mb-4 inline-block p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.subFeatures.map((subFeature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                      {subFeature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How CollabNote Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple three-step process to transform your note-taking experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4">
                    {step.icon}
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">Step {step.step}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
          </motion.div>
        ))}
      </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Note Taking?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already experiencing the future of collaborative document editing.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold shadow-lg hover:bg-indigo-50 transition-colors"
              >
                Start for Free <ArrowRight className="ml-2" />
        </Link>
            </motion.div>
          </motion.div>
      </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
