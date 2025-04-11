import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaPlus, FaEdit, FaTrash, FaChartLine } from 'react-icons/fa';

const OfferManager = () => {
  const [offers, setOffers] = useState([]);
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [newOffer, setNewOffer] = useState({
    name: '',
    discountPercentage: 0,
    startTime: '',
    endTime: '',
    routes: [],
    conditions: ''
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const offersRef = collection(db, 'offers');
      const snapshot = await getDocs(offersRef);
      const offersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffers(offersData);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    try {
      const offersRef = collection(db, 'offers');
      await addDoc(offersRef, {
        ...newOffer,
        createdAt: new Date(),
        active: true
      });
      setIsAddingOffer(false);
      setNewOffer({
        name: '',
        discountPercentage: 0,
        startTime: '',
        endTime: '',
        routes: [],
        conditions: ''
      });
      fetchOffers();
    } catch (error) {
      console.error('Error adding offer:', error);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    try {
      await deleteDoc(doc(db, 'offers', offerId));
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Seasonal Offers & Dynamic Pricing</h2>
        <button
          onClick={() => setIsAddingOffer(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FaPlus className="mr-2" />
          Add Offer
        </button>
      </div>

      {/* Add Offer Form */}
      {isAddingOffer && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 border border-gray-200 rounded-lg"
        >
          <form onSubmit={handleAddOffer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Name
                </label>
                <input
                  type="text"
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  value={newOffer.discountPercentage}
                  onChange={(e) => setNewOffer({ ...newOffer, discountPercentage: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={newOffer.startTime}
                  onChange={(e) => setNewOffer({ ...newOffer, startTime: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={newOffer.endTime}
                  onChange={(e) => setNewOffer({ ...newOffer, endTime: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditions
                </label>
                <textarea
                  value={newOffer.conditions}
                  onChange={(e) => setNewOffer({ ...newOffer, conditions: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-3">
              <button
                type="button"
                onClick={() => setIsAddingOffer(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save Offer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Offers List */}
      <div className="space-y-4">
        {offers.map((offer) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{offer.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {offer.discountPercentage}% off
                </p>
                <div className="text-sm text-gray-500 mt-2">
                  <p>Start: {new Date(offer.startTime).toLocaleString()}</p>
                  <p>End: {new Date(offer.endTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteOffer(offer.id)}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OfferManager; 