import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CheckInManager from '../../components/admin/CheckInManager';

const CheckInManagement = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Check-in Management</h1>
          <p className="text-gray-600">Monitor and manage passenger check-ins</p>
        </div>

        <CheckInManager />
      </motion.div>
    </DashboardLayout>
  );
};

export default CheckInManagement; 