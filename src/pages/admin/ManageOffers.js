import { motion } from 'framer-motion';
import OfferManager from '../../components/admin/OfferManager';
import PricingAnalytics from '../../components/admin/PricingAnalytics';
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
          <p className="text-gray-600">Configure seasonal offers and analyze dynamic pricing performance</p>
        </div>

       

        {/* Offer Management Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Seasonal Offers</h2>
          <OfferManager />
        </div>

         {/* Pricing Analytics Section */}
         <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pricing Analytics</h2>
          <PricingAnalytics />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ManageOffers; 