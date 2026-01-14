import { motion } from 'framer-motion';
import { FaLeaf, FaUsers, FaAward, FaRocket, FaHeart, FaGlobe } from 'react-icons/fa';
import { itemVariants, containerVariants } from '../components/animations/variants';

const values = [
  {
    icon: <FaLeaf className="text-4xl" />,
    title: 'Sustainability',
    description: 'Committed to reducing carbon footprint and promoting clean energy solutions.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: <FaUsers className="text-4xl" />,
    title: 'Community',
    description: 'Building a strong community of EV enthusiasts and supporting each other.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: <FaAward className="text-4xl" />,
    title: 'Excellence',
    description: 'Delivering exceptional service and quality in everything we do.',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: <FaRocket className="text-4xl" />,
    title: 'Innovation',
    description: 'Embracing cutting-edge technology and staying ahead of the curve.',
    color: 'from-orange-500 to-red-600'
  },
];

const stats = [
  { number: '10,000+', label: 'Happy Customers' },
  { number: '500+', label: 'Vehicles Sold' },
  { number: '50+', label: 'Service Centers' },
  { number: '24/7', label: 'Support Available' },
];

const AboutPage = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800"></div>
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto px-6"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            About <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">EVShop</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mt-4 leading-relaxed">
            We are a passionate team dedicated to accelerating the world's transition to sustainable energy.
          </p>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At EVShop, our goal is to make electric vehicles accessible and enjoyable for everyone. We believe that the future of transportation is electric, and we're committed to providing the best vehicles, services, and customer experience in the industry. It's not just about selling cars; it's about building a community and paving the way for a cleaner, greener planet.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Founded in 2020 by a group of engineers and environmental enthusiasts, EVShop started as a small dealership with a big vision. Today, we are proud to be a leading name in electric mobility, constantly pushing the boundaries of innovation and sustainability.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2"
                variants={itemVariants}
              >
                <div className={`bg-gradient-to-r ${value.color} w-16 h-16 rounded-full flex items-center justify-center text-white mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{value.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <FaGlobe className="text-6xl mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Vision</h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              To become the leading platform for electric vehicle commerce in Sri Lanka, making sustainable transportation accessible to everyone while building a thriving community of EV enthusiasts and supporting the nation's transition to clean energy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Join Us on This Journey</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Whether you're looking to buy your first EV, need maintenance services, or want to be part of our community, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/models"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Browse Vehicles
              </a>
              <a
                href="/contact"
                className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-blue-600"
              >
                Get in Touch
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
