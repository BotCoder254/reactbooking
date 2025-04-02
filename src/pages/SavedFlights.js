import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { FaPlane, FaCalendar, FaTrash, FaBookmark } from 'react-icons/fa';

const SavedFlights = () => {
  const [savedFlights, setSavedFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSavedFlights();
  }, [user]);

  const fetchSavedFlights = async () => {
    try {
      const savedRef = collection(db, 'saved_flights');
      const q = query(savedRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const flightsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedFlights(flightsData);
    } catch (error) {
      console.error('Error fetching saved flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedFlight = async (flightId) => {
    try {
      await deleteDoc(doc(db, 'saved_flights', flightId));
      setSavedFlights(prev => prev.filter(flight => flight.id !== flightId));
    } catch (error) {
      console.error('Error removing saved flight:', error);
    }
  };

  const SavedFlightCard = ({ flight }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm p-6 mb-4"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <FaPlane className="text-primary mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              {flight.airline}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-gray-600 mb-2">
                <span className="font-medium">{flight.from} → {flight.to}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FaCalendar className="mr-2" />
                <span>{new Date(flight.departureTime).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 mb-2">
                Duration: {flight.duration}h
              </div>
              <div className="text-primary font-semibold">
                Price: ${flight.price}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-0 md:ml-6">
          <button
            onClick={() => removeSavedFlight(flight.id)}
            className="text-red-500 hover:text-red-600 transition-colors p-2"
            title="Remove from saved"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Saved Flights</h1>
          <p className="text-gray-600">View and manage your saved flights</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : savedFlights.length > 0 ? (
          <AnimatePresence>
            {savedFlights.map(flight => (
              <SavedFlightCard key={flight.id} flight={flight} />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-8 text-center"
          >
            <FaBookmark className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Saved Flights</h3>
            <p className="text-gray-600">You haven't saved any flights yet.</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedFlights; 