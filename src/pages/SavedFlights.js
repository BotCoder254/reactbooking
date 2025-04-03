import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import FlightResults from '../components/flights/FlightResults';
import { FaBookmark } from 'react-icons/fa';

const SavedFlights = () => {
  const [savedFlights, setSavedFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    departureCity: '',
    arrivalCity: '',
    date: '',
    passengers: 1,
    priceRange: [0, 5000],
    duration: [0, 24],
    airline: '',
    airlines: [],
    stops: 'any',
    sortBy: 'price',
    departureTime: 'any',
    arrivalTime: 'any',
    cabinClass: 'any'
  });

  const handleFilterChange = (newFilters) => {
    // Update filters directly with the new filter values
    setFilters(newFilters);
  };

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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Saved Flights</h1>
          <p className="text-gray-600">Your bookmarked flights</p>
        </motion.div>

        {/* Flight Results */}
        <FlightResults
          flights={savedFlights}
          loading={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>
    </DashboardLayout>
  );
};

export default SavedFlights; 