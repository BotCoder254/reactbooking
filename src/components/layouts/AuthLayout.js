import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle, imageSrc }) => {
  return (
    <div className="min-h-screen flex">
      {/* Image Section */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <img
          src={imageSrc}
          alt="Travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#8F87F1]/80 to-[#C68EFD]/80 flex items-center justify-center">
          <div className="text-white text-center px-8">
            <h2 className="text-4xl font-bold mb-4">Explore the World</h2>
            <p className="text-xl">Your next adventure is just a few clicks away</p>
          </div>
        </div>
      </motion.div>

      {/* Form Section */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#8F87F1] mb-2">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout; 