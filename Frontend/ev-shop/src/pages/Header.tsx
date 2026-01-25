import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import type { Variants } from "framer-motion";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Effect to handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      // Set scrolled state if user scrolls down more than 50px
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Models", path: "/models" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  // Variants for the mobile menu animation
  const menuVariants: Variants = {
    // Add the type annotation here
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "tween", ease: "circOut" },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { type: "tween", ease: "circIn" },
    },
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-sm shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className={`text-2xl font-bold tracking-wider transition-colors duration-300 ${
              isScrolled ? "text-gray-900" : "text-white"
            }`}
          >
            E<span className="text-blue-600">Volte</span>
            {/* <img src={Logo} alt="Electro volt" className="w-15 h-15"/> */}
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`transition-colors duration-300 ${
                  isScrolled
                    ? "text-gray-700 hover:text-blue-600"
                    : "text-gray-200 hover:text-blue-400"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/auth/login"
              className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-full hover:bg-blue-700 transition-transform duration-300 hover:scale-105"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`text-2xl z-50 transition-colors duration-300 ${
                isScrolled ? "text-gray-900" : "text-white"
              }`}
            >
              {isOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu (conditionally rendered with animation) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-white z-40 p-8 pt-24 md:hidden shadow-xl"
            >
              <div className="flex flex-col items-center space-y-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-gray-700 text-2xl hover:text-blue-600 transition-colors duration-300"
                    onClick={() => setIsOpen(false)} // Close menu on click
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/auth/login"
                  className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-full text-lg mt-4"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
