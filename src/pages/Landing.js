import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaPlane, FaUserShield, FaClock } from 'react-icons/fa';

const Landing = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      icon: <FaPlane className="text-4xl text-[#8F87F1]" />,
      title: 'Easy Booking',
      description: 'Book your flights with just a few clicks'
    },
    {
      icon: <FaUserShield className="text-4xl text-[#C68EFD]" />,
      title: 'Secure Payments',
      description: 'Your transactions are protected and secure'
    },
    {
      icon: <FaClock className="text-4xl text-[#E9A5F1]" />,
      title: '24/7 Support',
      description: 'Round-the-clock customer service'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8F87F1] to-[#FED2E2]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div 
            className="text-white"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-6">
              Your Journey Begins Here
            </h1>
            <p className="text-xl mb-8">
              Discover amazing destinations and book your next adventure with ease.
            </p>
            <div className="space-x-4">
              <Link 
                to="/register" 
                className="bg-[#C68EFD] hover:bg-[#E9A5F1] text-white px-8 py-3 rounded-full font-semibold transition duration-300"
              >
                Get Started
              </Link>
              <Link 
                to="/login" 
                className="bg-white text-[#8F87F1] px-8 py-3 rounded-full font-semibold transition duration-300"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" 
              alt="Travel"
              className="rounded-lg shadow-xl"
            />
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl font-bold text-center mb-12 text-[#8F87F1]"
            {...fadeIn}
          >
            Why Choose Us
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-[#8F87F1]">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[#8F87F1] py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <Link 
              to="/register" 
              className="bg-white text-[#8F87F1] px-8 py-3 rounded-full font-semibold inline-block hover:bg-[#FED2E2] transition duration-300"
            >
              Book Now
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Landing; 