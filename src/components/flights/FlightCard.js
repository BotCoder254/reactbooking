import React from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaWifi, FaUtensils, FaTv, FaPlug } from 'react-icons/fa';

const FlightCard = ({ flight, onSelect }) => {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 w-full"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
              <FaPlane className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {flight.airline} - {flight.flightNumber}
              </h3>
              <p className="text-gray-600">{flight.aircraft}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">${flight.price}</p>
            <p className="text-sm text-gray-500">per person</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">Departure</p>
            <p className="font-semibold">{flight.departureCity}</p>
            <p className="text-sm text-gray-600">{formatDateTime(flight.departureTime)}</p>
          </div>
          <div className="flex flex-col items-center px-4">
            <p className="text-sm text-gray-500 mb-1">{formatDuration(flight.duration)}</p>
            <div className="relative w-32">
              <div className="absolute w-full h-0.5 bg-gray-300 top-1/2 transform -translate-y-1/2"></div>
              <FaPlane className="relative text-primary transform rotate-90" />
            </div>
            <p className="text-sm text-gray-500 mt-1">{flight.stops} stop(s)</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Arrival</p>
            <p className="font-semibold">{flight.arrivalCity}</p>
            <p className="text-sm text-gray-600">{formatDateTime(flight.arrivalTime)}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              {flight.amenities?.wifi && (
                <div className="flex items-center text-gray-600">
                  <FaWifi className="mr-1" />
                  <span className="text-sm">WiFi</span>
                </div>
              )}
              {flight.amenities?.meals && (
                <div className="flex items-center text-gray-600">
                  <FaUtensils className="mr-1" />
                  <span className="text-sm">Meals</span>
                </div>
              )}
              {flight.amenities?.entertainment && (
                <div className="flex items-center text-gray-600">
                  <FaTv className="mr-1" />
                  <span className="text-sm">Entertainment</span>
                </div>
              )}
              {flight.amenities?.powerOutlets && (
                <div className="flex items-center text-gray-600">
                  <FaPlug className="mr-1" />
                  <span className="text-sm">Power</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {flight.amenities?.baggage && `Baggage: ${flight.amenities.baggage}`}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Available Seats:</span>
              <span className="ml-2">
                Economy: {flight.totalSeats?.economy || 0},
                Business: {flight.totalSeats?.business || 0},
                First: {flight.totalSeats?.first || 0}
              </span>
            </div>
            <button
              onClick={() => onSelect(flight)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlightCard; 