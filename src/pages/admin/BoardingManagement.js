import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import BoardingManager from '../../components/admin/BoardingManager';

const BoardingManagement = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Boarding Management</h1>
          <p className="text-gray-600">Manage gates and boarding times for flights</p>
        </div>

        <BoardingManager />
      </motion.div>
    </DashboardLayout>
  );
};

export default BoardingManagement; 