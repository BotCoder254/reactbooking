import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaPlane, FaCalendar, FaUser, FaSearch, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const FlightSearch = () => {
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });
  const [suggestions, setSuggestions] = useState({
    from: [],
    to: []
  });
  const [showSuggestions, setShowSuggestions] = useState({
    from: false,
    to: false
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.from && searchParams.to && searchParams.date) {
      searchFlights();
    }
  }, [searchParams]);

  const fetchCitySuggestions = async (input, type) => {
    if (!input) return setSuggestions({ ...suggestions, [type]: [] });

    try {
      const citiesRef = collection(db, 'cities');
      const q = query(
        citiesRef,
        orderBy('name'),
        startAt(input.toLowerCase()),
        endAt(input.toLowerCase() + '\uf8ff'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const cities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuggestions({ ...suggestions, [type]: cities });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const searchFlights = async () => {
    if (!searchParams.from || !searchParams.to || !searchParams.date) return;

    setLoading(true);
    try {
      const flightsRef = collection(db, 'flights');
      
      // Create start and end timestamps for the selected date
      const searchDate = new Date(searchParams.date);
      searchDate.setHours(0, 0, 0, 0);
      const startTimestamp = Timestamp.fromDate(searchDate);
      
      const endDate = new Date(searchDate);
      endDate.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endDate);

      // Query with case-insensitive city names
      const fromCity = searchParams.from.toLowerCase();
      const toCity = searchParams.to.toLowerCase();

      const q = query(
        flightsRef,
        where('departureCityLower', '==', fromCity),
        where('arrivalCityLower', '==', toCity),
        where('departureTime', '>=', startTimestamp),
        where('departureTime', '<=', endTimestamp),
        orderBy('departureTime')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // If no results, try a broader search without time constraints
        const broadQ = query(
          flightsRef,
          where('departureCityLower', '==', fromCity),
          where('arrivalCityLower', '==', toCity)
        );
        const broadSnapshot = await getDocs(broadQ);
        const flights = broadSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSearchResults(flights);
      } else {
        const flights = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSearchResults(flights);
      }
    } catch (error) {
      console.error('Error searching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setSearchParams({ ...searchParams, [field]: value });
    if (field === 'from' || field === 'to') {
      fetchCitySuggestions(value, field);
      setShowSuggestions({ ...showSuggestions, [field]: true });
    }
  };

  const handleSuggestionClick = (city, field) => {
    setSearchParams({ ...searchParams, [field]: city.name });
    setShowSuggestions({ ...showSuggestions, [field]: false });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleClickOutside = (field) => {
    setTimeout(() => {
      setShowSuggestions({ ...showSuggestions, [field]: false });
    }, 200);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* From Field */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchParams.from}
              onChange={(e) => handleInputChange(e, 'from')}
              onFocus={() => setShowSuggestions({ ...showSuggestions, from: true })}
              onBlur={() => handleClickOutside('from')}
              className="w-full p-3 border border-gray-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Departure City"
            />
            <FaPlane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          {showSuggestions.from && suggestions.from.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
            >
              {suggestions.from.map((city) => (
                <div
                  key={city.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleSuggestionClick(city, 'from')}
                >
                  <FaMapMarkerAlt className="text-gray-400 mr-2" />
                  <span>{city.name}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* To Field */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchParams.to}
              onChange={(e) => handleInputChange(e, 'to')}
              onFocus={() => setShowSuggestions({ ...showSuggestions, to: true })}
              onBlur={() => handleClickOutside('to')}
              className="w-full p-3 border border-gray-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Destination City"
            />
            <FaPlane className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 rotate-90" />
          </div>
          {showSuggestions.to && suggestions.to.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
            >
              {suggestions.to.map((city) => (
                <div
                  key={city.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleSuggestionClick(city, 'to')}
                >
                  <FaMapMarkerAlt className="text-gray-400 mr-2" />
                  <span>{city.name}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={searchParams.date}
              onChange={(e) => handleInputChange(e, 'date')}
              className="w-full p-3 border border-gray-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
              min={new Date().toISOString().split('T')[0]}
            />
            <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Passengers Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passengers
          </label>
          <div className="relative">
            <input
              type="number"
              value={searchParams.passengers}
              onChange={(e) => handleInputChange(e, 'passengers')}
              min="1"
              max="9"
              className="w-full p-3 border border-gray-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : searchResults.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800">Available Flights</h3>
          <div className="space-y-4">
            {searchResults.map((flight) => (
              <motion.div
                key={flight.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">Flight {flight.flightNumber}</p>
                    <div className="flex items-center text-gray-600 mt-1">
                      <FaClock className="mr-1" />
                      <span>{formatDateTime(flight.departureTime)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {flight.departureCity} → {flight.arrivalCity}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      ${flight.price?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {flight.availableSeats} seats left
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : searchParams.from && searchParams.to && searchParams.date ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center text-gray-600"
        >
          No flights found for the selected criteria
        </motion.div>
      ) : null}
    </div>
  );
};

export default FlightSearch; 
