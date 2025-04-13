import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, FileText, Users, Share2, Image, LogIn, UserPlus, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', onClick: () => scrollToSection('features') },
    { name: 'About', onClick: () => scrollToSection('about') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/signin');
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <FileText className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
              </motion.div>
              <span className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                CollabNote
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.onClick ? (
                <motion.button
                  key={link.name}
                  onClick={link.onClick}
                  whileHover={{ y: -2 }}
                  className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center group"
                >
                  {link.name}
                  <ChevronDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </motion.button>
              ) : (
                <motion.div
                  key={link.name}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    to={link.path}
                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              )
            ))}
            {user ? (
              <div className="flex items-center space-x-4 ml-4">
                <motion.div whileHover={{ y: -2 }}>
                  <Link
                    to="/signin"
                    className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    <span>{user.name}</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-4">
                <motion.div whileHover={{ y: -2 }}>
                  <Link
                    to="/signin"
                    className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }}>
                  <Link
                    to="/signup"
                    className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Sign Up</span>
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-600 hover:text-indigo-600 p-2"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4">
                {navLinks.map((link) => (
                  link.onClick ? (
                    <motion.button
                      key={link.name}
                      onClick={link.onClick}
                      whileHover={{ x: 5 }}
                      className="block w-full text-left text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      {link.name}
                    </motion.button>
                  ) : (
                    <motion.div
                      key={link.name}
                      whileHover={{ x: 5 }}
                    >
                      <Link
                        to={link.path}
                        className="block text-gray-600 hover:text-indigo-600 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  )
                ))}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  {user ? (
                    <motion.div whileHover={{ x: 5 }}>
                      <Link
                        to="/signin"
                        className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
                      >
                        <User className="h-5 w-5 text-gray-500" />
                        <span>{user.name}</span>
                      </Link>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div whileHover={{ x: 5 }}>
                        <Link
                          to="/signin"
                          className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                          <LogIn className="h-5 w-5" />
                          <span>Sign In</span>
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ x: 5 }}>
                        <Link
                          to="/signup"
                          className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <UserPlus className="h-5 w-5" />
                          <span>Sign Up</span>
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
