import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { FaPlane, FaUser, FaPassport, FaPhone, FaEnvelope, FaCalendar } from 'react-icons/fa';

const FlightDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('economy');
  const [passengerInfo, setPassengerInfo] = useState({
    firstName: '',
    lastName: '',
    passportNumber: '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    nationality: ''
  });

  useEffect(() => {
    fetchFlightDetails();
  }, [id]);

  const fetchFlightDetails = async () => {
    try {
      const flightDoc = await getDoc(doc(db, 'flights', id));
      if (flightDoc.exists()) {
        setFlight({ id: flightDoc.id, ...flightDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching flight details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePassengerInfoChange = (e) => {
    const { name, value } = e.target;
    setPassengerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePrice = () => {
    if (!flight) return 0;
    const basePrice = flight.price;
    const multiplier = {
      economy: 1,
      business: 2.5,
      first: 4
    };
    return basePrice * multiplier[selectedClass];
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add booking logic here
    navigate('/bookings');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!flight) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FaPlane className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Flight Not Found</h3>
            <p className="text-gray-600 mb-4">The requested flight could not be found.</p>
            <button
              onClick={() => navigate('/flights')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Back to Flights
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Flight Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Flight Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Departure</h3>
                  <p className="text-lg font-bold">{flight.departureCity}</p>
                  <p className="text-gray-600">{formatDateTime(flight.departureTime)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Arrival</h3>
                  <p className="text-lg font-bold">{flight.arrivalCity}</p>
                  <p className="text-gray-600">{formatDateTime(flight.arrivalTime)}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Airline</h3>
                    <p>{flight.airline}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Flight Number</h3>
                    <p>{flight.flightNumber}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Aircraft</h3>
                    <p>{flight.aircraft}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Duration</h3>
                    <p>{Math.floor(flight.duration / 60)}h {flight.duration % 60}m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Information Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Passenger Information</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={passengerInfo.firstName}
                        onChange={handlePassengerInfoChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={passengerInfo.lastName}
                        onChange={handlePassengerInfoChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Number
                    </label>
                    <div className="relative">
                      <FaPassport className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="passportNumber"
                        value={passengerInfo.passportNumber}
                        onChange={handlePassengerInfoChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={passengerInfo.phone}
                        onChange={handlePassengerInfoChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={passengerInfo.email}
                        onChange={handlePassengerInfoChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={passengerInfo.dateOfBirth}
                        onChange={handlePassengerInfoChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Booking Summary</h2>
              
              {/* Class Selection */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Select Class</h3>
                <div className="space-y-2">
                  {['economy', 'business', 'first'].map((classType) => (
                    <label key={classType} className="flex items-center">
                      <input
                        type="radio"
                        value={classType}
                        checked={selectedClass === classType}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-2 capitalize">{classType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Base Price</span>
                  <span>${flight.price}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Class Upgrade</span>
                  <span>${calculatePrice() - flight.price}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4">
                  <span>Total</span>
                  <span>${calculatePrice()}</span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FlightDetails; 