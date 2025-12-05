import { motion } from 'framer-motion';

const AboutPage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative pt-32 pb-24 flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <img
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
          alt="Our Team"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <h1 className="text-6xl font-bold text-white">About EVShop</h1>
          <p className="text-xl text-gray-100 mt-4 max-w-3xl mx-auto">
            We are a passionate team dedicated to accelerating the world's transition to sustainable energy.
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-lg text-gray-700 leading-relaxed"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="mb-6">
              At EVShop, our goal is to make electric vehicles accessible and enjoyable for everyone. We believe that the future of transportation is electric, and we're committed to providing the best vehicles, services, and customer experience in the industry. It's not just about selling cars; it's about building a community and paving the way for a cleaner, greener planet.
            </p>
            <p>
              Founded in 2020 by a group of engineers and environmental enthusiasts, EVShop started as a small dealership with a big vision. Today, we are proud to be a leading name in electric mobility, constantly pushing the boundaries of innovation and sustainability.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
