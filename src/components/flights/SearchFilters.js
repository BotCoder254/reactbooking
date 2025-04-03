import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const SearchFilters = ({ filters, onFilterChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    duration: true,
    stops: true,
    time: false,
    airline: false,
    class: false
  });

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-gray-700">{title}</span>
        {expandedSections[section] ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const handlePriceChange = (value) => {
    const newFilters = {
      ...localFilters,
      priceRange: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDurationChange = (value) => {
    const newFilters = {
      ...localFilters,
      duration: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStopsChange = (value) => {
    const newFilters = {
      ...localFilters,
      stops: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAirlineToggle = (airline) => {
    const newAirlines = localFilters.airlines.includes(airline)
      ? localFilters.airlines.filter(a => a !== airline)
      : [...localFilters.airlines, airline];
    
    const newFilters = {
      ...localFilters,
      airlines: newAirlines
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTimeChange = (type, value) => {
    const newFilters = {
      ...localFilters,
      [type]: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCabinClassChange = (value) => {
    const newFilters = {
      ...localFilters,
      cabinClass: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-1">
      <FilterSection title="Price Range" section="price">
        <div className="px-2">
          <Slider
            range
            min={0}
            max={5000}
            value={filters.priceRange}
            onChange={handlePriceChange}
            className="my-6"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Flight Duration" section="duration">
        <div className="px-2">
          <Slider
            range
            min={0}
            max={24}
            value={filters.duration}
            onChange={handleDurationChange}
            className="my-6"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{filters.duration[0]}h</span>
            <span>{filters.duration[1]}h</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Stops" section="stops">
        <div className="space-y-2">
          {['any', '0', '1', '2'].map((stop) => (
            <label key={stop} className="flex items-center">
              <input
                type="radio"
                checked={filters.stops === stop}
                onChange={() => handleStopsChange(stop)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">
                {stop === 'any' ? 'Any' : `${stop} ${parseInt(stop) === 1 ? 'stop' : 'stops'}`}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Flight Times" section="time">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Time
            </label>
            <select
              value={filters.departureTime}
              onChange={(e) => handleTimeChange('departureTime', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="any">Any Time</option>
              <option value="morning">Morning (6AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 6PM)</option>
              <option value="evening">Evening (6PM - 12AM)</option>
              <option value="night">Night (12AM - 6AM)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arrival Time
            </label>
            <select
              value={filters.arrivalTime}
              onChange={(e) => handleTimeChange('arrivalTime', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="any">Any Time</option>
              <option value="morning">Morning (6AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 6PM)</option>
              <option value="evening">Evening (6PM - 12AM)</option>
              <option value="night">Night (12AM - 6AM)</option>
            </select>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Airlines" section="airline">
        <div className="space-y-2">
          {['Emirates', 'Qatar Airways', 'Lufthansa', 'British Airways'].map((airline) => (
            <label key={airline} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.airlines.includes(airline)}
                onChange={() => handleAirlineToggle(airline)}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">{airline}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Cabin Class" section="class">
        <div className="space-y-2">
          {['any', 'economy', 'business', 'first'].map((cabinClass) => (
            <label key={cabinClass} className="flex items-center">
              <input
                type="radio"
                checked={filters.cabinClass === cabinClass}
                onChange={() => handleCabinClassChange(cabinClass)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">
                {cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default SearchFilters; 