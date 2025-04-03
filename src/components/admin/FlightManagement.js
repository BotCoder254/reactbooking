import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaSearch, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DashboardLayout from '../layouts/DashboardLayout';

const FlightManagement = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentFlight, setCurrentFlight] = useState(null);
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    duration: '',
    stops: '0',
    aircraft: '',
    totalSeats: {
      economy: '',
      business: '',
      first: ''
    },
    seatsAvailable: {
      economy: '',
      business: '',
      first: ''
    },
    amenities: {
      wifi: false,
      meals: false,
      entertainment: false,
      powerOutlets: false,
      baggage: ''
    },
    status: 'scheduled'
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
      setFlights(flightsData);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const flightData = {
        airline: formData.airline,
        flightNumber: formData.flightNumber,
        departureCity: formData.departureCity,
        arrivalCity: formData.arrivalCity,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        stops: parseInt(formData.stops),
        aircraft: formData.aircraft,
        totalSeats: {
          economy: parseInt(formData.economySeats) || 0,
          business: parseInt(formData.businessSeats) || 0,
          first: parseInt(formData.firstSeats) || 0
        },
        seatsAvailable: {
          economy: parseInt(formData.economySeats) || 0,
          business: parseInt(formData.businessSeats) || 0,
          first: parseInt(formData.firstSeats) || 0
        },
        amenities: formData.amenities,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (currentFlight) {
        // When editing, only update seatsAvailable if the total seats have increased
        const updates = { ...flightData };
        const currentSeats = currentFlight.totalSeats || {};
        
        Object.keys(flightData.totalSeats).forEach(seatClass => {
          const newTotal = flightData.totalSeats[seatClass];
          const currentTotal = currentSeats[seatClass] || 0;
          const currentAvailable = currentFlight.seatsAvailable?.[seatClass] || 0;
          
          if (newTotal > currentTotal) {
            // If increasing total seats, add the difference to available seats
            updates.seatsAvailable[seatClass] = currentAvailable + (newTotal - currentTotal);
          } else {
            // If decreasing or same, keep current available seats (unless it would exceed new total)
            updates.seatsAvailable[seatClass] = Math.min(currentAvailable, newTotal);
          }
        });

        await updateDoc(doc(db, 'flights', currentFlight.id), updates);
      } else {
        await addDoc(collection(db, 'flights'), flightData);
      }

      setShowForm(false);
      setCurrentFlight(null);
      setFormData({
        airline: '',
        flightNumber: '',
        departureCity: '',
        arrivalCity: '',
        departureTime: '',
        arrivalTime: '',
        price: '',
        duration: '',
        stops: '0',
        aircraft: '',
        totalSeats: {
          economy: '',
          business: '',
          first: ''
        },
        seatsAvailable: {
          economy: '',
          business: '',
          first: ''
        },
        amenities: {
          wifi: false,
          meals: false,
          entertainment: false,
          powerOutlets: false,
          baggage: ''
        },
        status: 'scheduled'
      });
      await fetchFlights();
    } catch (error) {
      console.error('Error saving flight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (flight) => {
    setCurrentFlight(flight);
    setFormData({
      ...flight,
      price: flight.price.toString(),
      duration: flight.duration.toString(),
      stops: flight.stops.toString(),
      totalSeats: {
        economy: flight.totalSeats?.economy?.toString() || '',
        business: flight.totalSeats?.business?.toString() || '',
        first: flight.totalSeats?.first?.toString() || ''
      },
      seatsAvailable: {
        economy: flight.seatsAvailable?.economy?.toString() || '',
        business: flight.seatsAvailable?.business?.toString() || '',
        first: flight.seatsAvailable?.first?.toString() || ''
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this flight?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'flights', id));
        await fetchFlights();
      } catch (error) {
        console.error('Error deleting flight:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredFlights = flights.filter(flight =>
    flight.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.departureCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.arrivalCity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Flight Management</h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Flight
            </button>
          </div>

          <div className="flex items-center bg-white rounded-lg shadow-sm p-4 mb-6">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search flights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full focus:outline-none"
            />
          </div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              {currentFlight ? 'Edit Flight' : 'Add New Flight'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Airline
                  </label>
                  <input
                    type="text"
                    name="airline"
                    value={formData.airline}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure City
                  </label>
                  <input
                    type="text"
                    name="departureCity"
                    value={formData.departureCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival City
                  </label>
                  <input
                    type="text"
                    name="arrivalCity"
                    value={formData.arrivalCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Time
                  </label>
                  <input
                    type="datetime-local"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stops
                  </label>
                  <input
                    type="number"
                    name="stops"
                    value={formData.stops}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aircraft
                  </label>
                  <input
                    type="text"
                    name="aircraft"
                    value={formData.aircraft}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Seat Configuration */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Seat Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Economy Seats
                    </label>
                    <input
                      type="number"
                      name="economySeats"
                      value={formData.economySeats}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Seats
                    </label>
                    <input
                      type="number"
                      name="businessSeats"
                      value={formData.businessSeats}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Class Seats
                    </label>
                    <input
                      type="number"
                      name="firstSeats"
                      value={formData.firstSeats}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="amenities.wifi"
                        checked={formData.amenities.wifi}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Wi-Fi Available</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="amenities.meals"
                        checked={formData.amenities.meals}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Meals Included</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="amenities.entertainment"
                        checked={formData.amenities.entertainment}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">In-flight Entertainment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="amenities.powerOutlets"
                        checked={formData.amenities.powerOutlets}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-gray-700">Power Outlets</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Baggage Allowance
                    </label>
                    <input
                      type="text"
                      name="amenities.baggage"
                      value={formData.amenities.baggage}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                      placeholder="e.g., 2x23kg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setCurrentFlight(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : currentFlight ? 'Update Flight' : 'Add Flight'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flight Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredFlights.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No flights found
                    </td>
                  </tr>
                ) : (
                  filteredFlights.map((flight) => (
                    <tr key={flight.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                              <FaPlane className="text-primary" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {flight.airline} - {flight.flightNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.departureCity} → {flight.arrivalCity}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(flight.departureTime).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Duration: {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ${flight.price}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${flight.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                            flight.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}
                        >
                          {flight.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleEdit(flight)}
                          className="text-primary hover:text-primary-hover mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(flight.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FlightManagement;