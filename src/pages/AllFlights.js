import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import DashboardLayout from '../components/layouts/DashboardLayout';
import FlightResults from '../components/flights/FlightResults';
import { FaPlane, FaSearch, FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const AllFlights = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'flights'));
      const flightsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort flights by default
      flightsData.sort((a, b) => a.price - b.price);
      setFlights(flightsData);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    // Ensure all filter properties are properly initialized
    const updatedFilters = {
      ...filters,
      ...newFilters,
      priceRange: newFilters.priceRange || filters.priceRange,
      duration: newFilters.duration || filters.duration,
      airlines: newFilters.airlines || filters.airlines,
      stops: newFilters.stops || filters.stops,
      departureTime: newFilters.departureTime || filters.departureTime,
      arrivalTime: newFilters.arrivalTime || filters.arrivalTime,
      cabinClass: newFilters.cabinClass || filters.cabinClass
    };
    setFilters(updatedFilters);
  };

  // Only apply filters if there's a search term or any filter is active
  const isFilterActive = () => {
    return searchTerm !== '' ||
           filters.departureCity !== '' ||
           filters.arrivalCity !== '' ||
           filters.airline !== '' ||
           filters.stops !== 'any';
  };

  const getFilteredFlights = () => {
    if (!isFilterActive()) {
      // If no filters are active, return all flights sorted by the selected criteria
      return [...flights].sort((a, b) => {
        if (filters.sortBy === 'duration') {
          return a.duration - b.duration;
        }
        return a.price - b.price;
      });
    }

    return flights.filter(flight => {
      const matchesSearch = !searchTerm || (
        (flight.airline?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (flight.departureCity?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (flight.arrivalCity?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (flight.flightNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

      const matchesDepartureCity = !filters.departureCity || 
        (flight.departureCity?.toLowerCase() || '') === filters.departureCity.toLowerCase();

      const matchesArrivalCity = !filters.arrivalCity || 
        (flight.arrivalCity?.toLowerCase() || '') === filters.arrivalCity.toLowerCase();

      const matchesAirline = !filters.airline || 
        (flight.airline?.toLowerCase() || '') === filters.airline.toLowerCase();

      const matchesStops = filters.stops === 'any' || 
        flight.stops === parseInt(filters.stops);

      const matchesPrice = flight.price >= filters.priceRange[0] && 
        flight.price <= filters.priceRange[1];

      return matchesSearch && matchesDepartureCity && matchesArrivalCity && 
             matchesAirline && matchesStops && matchesPrice;
    }).sort((a, b) => {
      if (filters.sortBy === 'duration') {
        return a.duration - b.duration;
      }
      return a.price - b.price;
    });
  };

  const filteredFlights = getFilteredFlights();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Available Flights</h1>
          <p className="text-gray-600">Browse and book available flights</p>
        </motion.div>

        {/* Search and Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search flights by airline, destination, or flight number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <FaFilter />
              <span>Filters</span>
              {showFilters ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure City
                    </label>
                    <input
                      type="text"
                      name="departureCity"
                      value={filters.departureCity}
                      onChange={(e) => handleFilterChange({ ...filters, departureCity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="From"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrival City
                    </label>
                    <input
                      type="text"
                      name="arrivalCity"
                      value={filters.arrivalCity}
                      onChange={(e) => handleFilterChange({ ...filters, arrivalCity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="To"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Airline
                    </label>
                    <input
                      type="text"
                      name="airline"
                      value={filters.airline}
                      onChange={(e) => handleFilterChange({ ...filters, airline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="Airline name"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Flight Results */}
        <FlightResults
          flights={filteredFlights}
          loading={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>
    </DashboardLayout>
  );
};

export default AllFlights; 