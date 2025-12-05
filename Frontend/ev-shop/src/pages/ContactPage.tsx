import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const ContactPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900">Get In Touch</h1>
            <p className="text-lg text-gray-600 mt-2">We'd love to hear from you. Send us a message or visit us.</p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <form className="space-y-6 bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" id="name" className="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-3 px-4 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" id="email" className="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-3 px-4 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea id="message" rows={5} className="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-3 px-4 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105">
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6 text-lg bg-white p-8 rounded-lg shadow-lg border border-gray-200"
            >
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-blue-600 text-2xl mt-1 mr-4" />
                <p className="text-gray-700">123 Electric Avenue,<br />Halloluwa, Central Province, Sri Lanka</p>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-blue-600 text-2xl mr-4" />
                <p className="text-gray-700">+94 81 234 5678</p>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-blue-600 text-2xl mr-4" />
                <p className="text-gray-700">contact@evshop.lk</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
