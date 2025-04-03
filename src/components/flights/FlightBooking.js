import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { FaTimes, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

const FlightBooking = ({ flight, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSeats, setAvailableSeats] = useState({
    economy: 0,
    business: 0,
    first: 0
  });
  const [passengers, setPassengers] = useState([{
    firstName: '',
    lastName: '',
    type: 'adult',
    seatClass: 'economy',
    seatNumber: '',
    specialRequests: ''
  }]);
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
    address: '',
  });
  const [preferences, setPreferences] = useState({
    seatPreference: 'window',
    mealPreference: 'standard',
    specialAssistance: false,
  });

  useEffect(() => {
    let unsubscribe;
    if (flight.id) {
      unsubscribe = onSnapshot(doc(db, 'flights', flight.id), (doc) => {
      if (doc.exists()) {
          const data = doc.data();
        setAvailableSeats({
            economy: data.seatsAvailable?.economy || 0,
            business: data.seatsAvailable?.business || 0,
            first: data.seatsAvailable?.first || 0
        });
      }
    });
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [flight.id]);

  const removePassenger = (index) => {
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  const generateSeatNumber = (seatClass) => {
    const prefix = {
      'economy': 'E',
      'business': 'B',
      'first': 'F'
    }[seatClass] || 'E';

    const availableSeats = flight.seatsAvailable?.[seatClass] || 0;
    if (availableSeats <= 0) return null;

    // Generate a random seat number between 1 and available seats
    const seatNumber = Math.floor(Math.random() * availableSeats) + 1;
    return `${prefix}${seatNumber.toString().padStart(2, '0')}`;
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    if (field === 'seatClass') {
      // Generate new seat number when class changes
      const newSeatNumber = generateSeatNumber(value);
      updatedPassengers[index] = {
        ...updatedPassengers[index],
        [field]: value,
        seatNumber: newSeatNumber
      };
    } else {
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
      }
    setPassengers(updatedPassengers);
  };

  const handleContactChange = (field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPassenger = () => {
    if (passengers.length < 9) {
      const defaultClass = 'economy';
      const newSeatNumber = generateSeatNumber(defaultClass);
      setPassengers([
        ...passengers,
        {
          firstName: '',
          lastName: '',
          type: 'adult',
          seatClass: defaultClass,
          seatNumber: newSeatNumber,
          specialRequests: ''
      }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError('Please log in to make a booking');
      setLoading(false);
      return;
    }

    try {
      // Calculate total price based on seat classes
      const totalPrice = passengers.reduce((sum, passenger) => {
        const basePrice = flight.price || 0;
        const multiplier = {
          economy: 1,
          business: 2.5,
          first: 4
        };
        return sum + (basePrice * multiplier[passenger.seatClass.toLowerCase()]);
      }, 0);

      // Group passengers by seat class
      const passengersByClass = passengers.reduce((acc, passenger) => {
        const seatClass = passenger.seatClass.toLowerCase();
        acc[seatClass] = (acc[seatClass] || 0) + 1;
        return acc;
      }, {});

      // Verify seat availability
      for (const [seatClass, count] of Object.entries(passengersByClass)) {
        if (availableSeats[seatClass] < count) {
          throw new Error(`Not enough ${seatClass} seats available`);
        }
      }

      // Update available seats for each class
      const flightRef = doc(db, 'flights', flight.id);
      const updates = {};
      
      for (const [seatClass, count] of Object.entries(passengersByClass)) {
        updates[`seatsAvailable.${seatClass}`] = increment(-count);
      }
      
      await updateDoc(flightRef, updates);

      // Create booking document
      const bookingData = {
        userId: user.uid,
        flightId: flight.id,
        flightDetails: {
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          departureCity: flight.departureCity,
          arrivalCity: flight.arrivalCity,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime
        },
        passengers: passengers.map(p => ({
          ...p,
          seatNumber: generateSeatNumber(p.seatClass)
        })),
        contactInfo,
        preferences,
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Create booking
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Navigate to payment
      navigate(`/bookings/${bookingRef.id}/payment`);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Flight Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mt-4">
            {['Passenger Details', 'Contact Info', 'Preferences'].map((s, i) => (
              <div
                key={s}
                className={`flex items-center ${
                  i < step ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < step ? 'bg-primary text-white' : 'bg-gray-200'
                  }`}
                >
                  {i + 1}
                </div>
                <span className="ml-2 text-sm hidden md:inline">{s}</span>
                {i < 2 && (
                  <div
                    className={`w-full h-0.5 mx-4 ${
                      i < step - 1 ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Passenger Details */}
            {step === 1 && (
              <div className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Passenger {index + 1}
                      </h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={passenger.firstName}
                          onChange={(e) =>
                            handlePassengerChange(index, 'firstName', e.target.value)
                          }
                          className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={passenger.lastName}
                          onChange={(e) =>
                            handlePassengerChange(index, 'lastName', e.target.value)
                          }
                          className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seat Class
                        </label>
                        <select
                          value={passenger.seatClass}
                          onChange={(e) => handlePassengerChange(index, 'seatClass', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="economy" disabled={availableSeats.economy === 0}>
                            Economy ({availableSeats.economy} available)
                          </option>
                          <option value="business" disabled={availableSeats.business === 0}>
                            Business ({availableSeats.business} available)
                          </option>
                          <option value="first" disabled={availableSeats.first === 0}>
                            First Class ({availableSeats.first} available)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seat Number
                        </label>
                        <input
                          type="text"
                          value={passenger.seatNumber || 'Not assigned yet'}
                          readOnly
                          className="w-full h-10 px-3 rounded-md border border-gray-300 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {passengers.length < 9 && (
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="flex items-center text-primary hover:text-primary-dark"
                  >
                    <span className="mr-2">+</span>
                    Add Another Passenger
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div className="space-y-6 bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={contactInfo.address}
                    onChange={(e) => handleContactChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-6 bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seat Preference
                    </label>
                    <select
                      value={preferences.seatPreference}
                      onChange={(e) => handlePreferenceChange('seatPreference', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="window">Window</option>
                      <option value="aisle">Aisle</option>
                      <option value="middle">Middle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Preference
                    </label>
                    <select
                      value={preferences.mealPreference}
                      onChange={(e) => handlePreferenceChange('mealPreference', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="standard">Standard</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="halal">Halal</option>
                      <option value="kosher">Kosher</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.specialAssistance}
                      onChange={(e) => handlePreferenceChange('specialAssistance', e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Special Assistance Required
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t border-gray-200 mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Booking'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default FlightBooking; 