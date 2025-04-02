import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import FlightCard from '../components/flights/FlightCard';
import { FaBookmark } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SavedFlights = () => {
  const [savedFlights, setSavedFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleFlightSelect = (flight) => {
    navigate(`/flights/${flight.flightId}`);
  };

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
            <div className="grid grid-cols-1 gap-6">
              {savedFlights.map((flight) => (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <FlightCard
                    flight={{
                      ...flight,
                      id: flight.flightId // Ensure the original flight ID is passed
                    }}
                    onSelect={() => handleFlightSelect(flight)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-8 text-center"
          >
            <FaBookmark className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Saved Flights</h3>
            <p className="text-gray-600">
              You haven't saved any flights yet. Browse flights and click the heart icon to save them for later.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedFlights; 