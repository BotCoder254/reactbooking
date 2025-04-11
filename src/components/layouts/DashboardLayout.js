import { motion } from 'framer-motion';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 min-h-screen overflow-x-hidden"
      >
        {/* Content Area */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout; 