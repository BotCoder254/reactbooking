import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaClock, FaDollarSign, FaSun, FaMoon, FaCouch } from 'react-icons/fa';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const SearchFilters = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const airlines = [
    'Emirates',
    'Qatar Airways',
    'Lufthansa',
    'British Airways',
    'Air France',
    'KLM',
    'Singapore Airlines',
    'Turkish Airlines',
    'Etihad Airways',
    'American Airlines'
  ];

  const timeSlots = [
    { value: 'any', label: 'Any Time' },
    { value: 'morning', label: 'Morning (6AM-12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM-6PM)' },
    { value: 'evening', label: 'Evening (After 6PM)' }
  ];

  const cabinClasses = [
    { value: 'any', label: 'Any Class' },
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' }
  ];

  useEffect(() => {
    onFilterChange(localFilters);
  }, [localFilters, onFilterChange]);

  const handlePriceChange = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: value,
    }));
  };

  const handleDurationChange = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      duration: value,
    }));
  };

  const handleStopsChange = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      stops: value,
    }));
  };

  const handleAirlineToggle = (airline) => {
    setLocalFilters(prev => ({
      ...prev,
      airlines: prev.airlines.includes(airline)
        ? prev.airlines.filter(a => a !== airline)
        : [...prev.airlines, airline],
    }));
  };

  const handleTimeChange = (type, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleCabinClassChange = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      cabinClass: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FaDollarSign className="mr-2" />
          Price Range
        </h3>
        <Slider
          range
          min={0}
          max={2000}
          value={localFilters.priceRange}
          onChange={handlePriceChange}
          className="mt-2"
          trackStyle={[{ backgroundColor: '#8F87F1' }]}
          handleStyle={[
            { borderColor: '#8F87F1', backgroundColor: '#8F87F1' },
            { borderColor: '#8F87F1', backgroundColor: '#8F87F1' },
          ]}
          railStyle={{ backgroundColor: '#E5E7EB' }}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>${localFilters.priceRange[0]}</span>
          <span>${localFilters.priceRange[1]}</span>
        </div>
      </div>

      {/* Duration */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FaClock className="mr-2" />
          Flight Duration (hours)
        </h3>
        <Slider
          range
          min={0}
          max={24}
          value={localFilters.duration}
          onChange={handleDurationChange}
          className="mt-2"
          trackStyle={[{ backgroundColor: '#8F87F1' }]}
          handleStyle={[
            { borderColor: '#8F87F1', backgroundColor: '#8F87F1' },
            { borderColor: '#8F87F1', backgroundColor: '#8F87F1' },
          ]}
          railStyle={{ backgroundColor: '#E5E7EB' }}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{localFilters.duration[0]}h</span>
          <span>{localFilters.duration[1]}h</span>
        </div>
      </div>

      {/* Stops */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FaPlane className="mr-2" />
          Stops
        </h3>
        <div className="space-y-2">
          {['any', 'nonstop', '1-stop', '2-stops'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                checked={localFilters.stops === option}
                onChange={() => handleStopsChange(option)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {option === 'any' ? 'Any' : option}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Departure Time */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FaSun className="mr-2" />
          Departure Time
        </h3>
        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <label key={slot.value} className="flex items-center">
              <input
                type="radio"
                checked={localFilters.departureTime === slot.value}
                onChange={() => handleTimeChange('departureTime', slot.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">
                {slot.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Arrival Time */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FaMoon className="mr-2" />
          Arrival Time
        </h3>
        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <label key={slot.value} className="flex items-center">
              <input
                type="radio"
                checked={localFilters.arrivalTime === slot.value}
                onChange={() => handleTimeChange('arrivalTime', slot.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">
                {slot.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Cabin Class */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FaCouch className="mr-2" />
          Cabin Class
        </h3>
        <div className="space-y-2">
          {cabinClasses.map((cabin) => (
            <label key={cabin.value} className="flex items-center">
              <input
                type="radio"
                checked={localFilters.cabinClass === cabin.value}
                onChange={() => handleCabinClassChange(cabin.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">
                {cabin.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Airlines */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Airlines</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {airlines.map((airline) => (
            <label key={airline} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.airlines.includes(airline)}
                onChange={() => handleAirlineToggle(airline)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">{airline}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset Filters */}
      <button
        onClick={() => setLocalFilters(filters)}
        className="w-full text-sm text-primary hover:text-primary-hover transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default SearchFilters; 