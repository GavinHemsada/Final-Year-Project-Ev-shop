import { motion } from 'framer-motion';
import { FaChargingStation, FaTools, FaHandHoldingUsd, FaHeadset } from 'react-icons/fa';
import { itemVariants, listVariants } from '../components/animations/variants';

const services = [
  {
    icon: <FaChargingStation className="text-5xl" />,
    title: 'Home Charging Solutions',
    description: 'We offer professional installation of Level 2 charging stations at your home for fast, convenient charging overnight.',
  },
  {
    icon: <FaTools className="text-5xl" />,
    title: 'Maintenance & Repairs',
    description: 'Our certified technicians are specially trained to service electric vehicles, from battery diagnostics to tire rotations.',
  },
  {
    icon: <FaHandHoldingUsd className="text-5xl" />,
    title: 'Financing & Leasing',
    description: 'Explore flexible financing and leasing options tailored to your budget, making your switch to electric easier than ever.',
  },
  {
    icon: <FaHeadset className="text-5xl" />,
    title: '24/7 Roadside Assistance',
    description: 'Drive with peace of mind knowing our dedicated EV support team is available 24/7 for any roadside emergencies.',
  },
];


const ServicesPage = () => {
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
            <h1 className="text-5xl font-bold text-gray-900">Owner Services</h1>
            <p className="text-lg text-gray-600 mt-2">We're here to support you for the entire life of your vehicle.</p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto space-y-8"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="flex items-start bg-white p-8 rounded-lg shadow-lg border border-gray-200"
                variants={itemVariants}
              >
                <div className="text-blue-600 mr-8">{service.icon}</div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900">{service.title}</h2>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
