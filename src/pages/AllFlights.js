import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import DashboardLayout from '../components/layouts/DashboardLayout';
import FlightCard from '../components/flights/FlightCard';
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
    airline: '',
    stops: 'any',
    sortBy: 'price'
  });
  const navigate = useNavigate();

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

  const handleFlightSelect = (flight) => {
    navigate(`/flights/${flight.id}`);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
                      onChange={handleFilterChange}
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
                      onChange={handleFilterChange}
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
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="Airline name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stops
                    </label>
                    <select
                      name="stops"
                      value={filters.stops}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="any">Any</option>
                      <option value="0">Non-stop</option>
                      <option value="1">1 Stop</option>
                      <option value="2">2+ Stops</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    >
                      <option value="price">Price: Low to High</option>
                      <option value="duration">Duration: Shortest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passengers
                    </label>
                    <input
                      type="number"
                      name="passengers"
                      value={filters.passengers}
                      onChange={handleFilterChange}
                      min="1"
                      max="9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredFlights.length > 0 ? (
          <AnimatePresence>
            <div className="grid grid-cols-1 gap-6">
              {filteredFlights.map((flight) => (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <FlightCard
                    flight={flight}
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
            <FaPlane className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Flights Found</h3>
            <p className="text-gray-600">
              {isFilterActive()
                ? 'Try adjusting your search criteria'
                : 'No flights are currently available'}
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AllFlights; 