import { motion } from 'framer-motion';
import OfferManager from '../../components/admin/OfferManager';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const ManageOffers = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Offers & Pricing</h1>
          <p className="text-gray-600">Configure seasonal offers and dynamic pricing rules</p>
        </div>

        <OfferManager />
      </motion.div>
    </DashboardLayout>
  );
};

export default ManageOffers; 