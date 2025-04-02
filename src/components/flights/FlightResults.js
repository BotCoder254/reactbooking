import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlightCard from './FlightCard';
import FlightBooking from './FlightBooking';
import SearchFilters from './SearchFilters';

const FlightResults = ({ flights, loading, filters, onFilterChange }) => {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
  };

  const handleCloseBooking = () => {
    setSelectedFlight(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Section */}
        <div className="md:w-1/4">
          <div className="sticky top-24">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  {showFilters ? '×' : 'Show Filters'}
                </button>
              </div>
              <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
                <SearchFilters filters={filters} onFilterChange={onFilterChange} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="md:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : flights.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Flights Found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <p className="text-gray-700">
                  Found {flights.length} flights matching your criteria
                </p>
              </div>
              <AnimatePresence>
                {flights.map((flight) => (
                  <motion.div
                    key={flight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FlightCard
                      flight={flight}
                      onSelect={() => handleFlightSelect(flight)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedFlight && (
          <FlightBooking
            flight={selectedFlight}
            onClose={handleCloseBooking}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlightResults; 