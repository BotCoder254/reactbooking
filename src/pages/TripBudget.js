import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layouts/DashboardLayout';
import TripBudgetPlanner from '../components/budget/TripBudgetPlanner';

const TripBudget = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Trip Budget Planner</h1>
          <p className="text-gray-600">Plan and track your travel expenses</p>
        </div>

        <TripBudgetPlanner />
      </motion.div>
    </DashboardLayout>
  );
};

export default TripBudget; 