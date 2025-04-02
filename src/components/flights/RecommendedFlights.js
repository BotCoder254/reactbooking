import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import FlightCard from './FlightCard';

const RecommendedFlights = () => {
  const [recommendedFlights, setRecommendedFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendedFlights = async () => {
      try {
        const q = query(collection(db, 'flights'), limit(3));
        const querySnapshot = await getDocs(q);
        const flights = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecommendedFlights(flights);
        setError(null);
      } catch (error) {
        console.error('Error fetching recommended flights:', error);
        setError('Failed to load recommendations');
        setRecommendedFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedFlights();
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recommended Flights
        </h2>
        <p className="text-red-500 text-center py-4">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Recommended Flights
      </h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : recommendedFlights.length > 0 ? (
        <div className="space-y-6">
          {recommendedFlights.map((flight) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <FlightCard flight={flight} />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No recommendations available
        </p>
      )}
    </div>
  );
};

export default RecommendedFlights; 
