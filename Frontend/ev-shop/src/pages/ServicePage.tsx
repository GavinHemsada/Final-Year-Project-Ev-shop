import { motion } from 'framer-motion';
import { 
  FaChargingStation, 
  FaTools, 
  FaHandHoldingUsd, 
  FaHeadset,
  FaBolt,
  FaShieldAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { itemVariants, listVariants } from '../components/animations/variants';

const services = [
  {
    icon: <FaChargingStation className="text-5xl" />,
    title: 'Home Charging Solutions',
    description: 'We offer professional installation of Level 2 charging stations at your home for fast, convenient charging overnight.',
    features: ['Professional installation', 'Level 2 charging support', '24/7 monitoring', 'Warranty included'],
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: <FaTools className="text-5xl" />,
    title: 'Maintenance & Repairs',
    description: 'Our certified technicians are specially trained to service electric vehicles, from battery diagnostics to tire rotations.',
    features: ['Certified EV technicians', 'Battery health checks', 'Software updates', 'Preventive maintenance'],
    color: 'from-green-500 to-green-600'
  },
  {
    icon: <FaHandHoldingUsd className="text-5xl" />,
    title: 'Financing & Leasing',
    description: 'Explore flexible financing and leasing options tailored to your budget, making your switch to electric easier than ever.',
    features: ['Flexible payment plans', 'Competitive rates', 'Quick approval', 'Trade-in options'],
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: <FaHeadset className="text-5xl" />,
    title: '24/7 Roadside Assistance',
    description: 'Drive with peace of mind knowing our dedicated EV support team is available 24/7 for any roadside emergencies.',
    features: ['24/7 availability', 'EV-specific support', 'Fast response time', 'Nationwide coverage'],
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: <FaBolt className="text-5xl" />,
    title: 'Battery Health Monitoring',
    description: 'Advanced diagnostic tools to monitor your battery health and optimize performance throughout your vehicle\'s lifespan.',
    features: ['Real-time monitoring', 'Health reports', 'Performance optimization', 'Early issue detection'],
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    icon: <FaShieldAlt className="text-5xl" />,
    title: 'Extended Warranty',
    description: 'Comprehensive warranty coverage for peace of mind, protecting your investment in electric mobility.',
    features: ['Extended coverage', 'Transferable warranty', 'All components covered', 'No hidden fees'],
    color: 'from-red-500 to-red-600'
  },
];

const ServicesPage = () => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Services</h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
              Comprehensive support for your electric vehicle journey. From charging solutions to maintenance, we've got you covered.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <main className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 transform hover:-translate-y-2"
                variants={itemVariants}
              >
                {/* Icon Header */}
                <div className={`bg-gradient-to-r ${service.color} p-6 text-white`}>
                  <div className="flex justify-center mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      {service.icon}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center">{service.title}</h2>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                  
                  {/* Features List */}
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                    Learn More
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Contact us today to learn more about our services and how we can help you with your electric vehicle needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Contact Us
              </a>
              <a
                href="/models"
                className="bg-blue-700/50 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 border border-white/20"
              >
                Browse Vehicles
              </a>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
