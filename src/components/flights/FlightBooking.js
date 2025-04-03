import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

const FlightBooking = ({ flight, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableSeats, setAvailableSeats] = useState({
    economy: flight.totalSeats?.economy || 0,
    business: flight.totalSeats?.business || 0,
    first: flight.totalSeats?.first || 0
  });
  const [formData, setFormData] = useState({
    passengers: [{
      title: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      passportNumber: '',
      nationality: '',
      seatNumber: '',
      seatClass: 'economy'
    }],
    contactInfo: {
      email: currentUser?.email || '',
      phone: '',
      address: '',
    },
    seatPreferences: {
      seatType: 'window',
      mealPreference: 'standard',
      specialAssistance: false,
    },
  });

  useEffect(() => {
    const unsubscribe = setupRealtimeSeats();
    return () => unsubscribe();
  }, [flight.id]);

  const setupRealtimeSeats = () => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('flightId', '==', flight.id));
    
    return onSnapshot(q, (snapshot) => {
      const bookedSeats = {
        economy: 0,
        business: 0,
        first: 0
      };
      const occupiedSeatNumbers = new Set();

      snapshot.docs.forEach(doc => {
        const booking = doc.data();
        if (booking.status !== 'cancelled') {
          const passengers = booking.passengers || [];
          passengers.forEach(passenger => {
            const seatClass = passenger.seatClass?.toLowerCase() || 'economy';
            bookedSeats[seatClass]++;
            if (passenger.seatNumber) {
              occupiedSeatNumbers.add(passenger.seatNumber);
            }
          });
        }
      });

      setAvailableSeats({
        economy: Math.max(0, (flight.totalSeats?.economy || 0) - bookedSeats.economy),
        business: Math.max(0, (flight.totalSeats?.business || 0) - bookedSeats.business),
        first: Math.max(0, (flight.totalSeats?.first || 0) - bookedSeats.first)
      });

      // Update seat numbers for passengers if their seats are taken
      setFormData(prev => ({
        ...prev,
        passengers: prev.passengers.map(passenger => ({
          ...passenger,
          seatNumber: occupiedSeatNumbers.has(passenger.seatNumber) ? '' : passenger.seatNumber
        }))
      }));
    });
  };

  const generateSeatNumber = (seatClass) => {
    const prefix = seatClass === 'first' ? 'F' : seatClass === 'business' ? 'B' : 'E';
    const row = Math.floor(Math.random() * 30) + 1;
    const seat = String.fromCharCode(65 + Math.floor(Math.random() * 6));
    return `${prefix}${row}${seat}`;
  };

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...formData.passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    
    // Auto-assign seat number when class is selected
    if (field === 'seatClass' && !newPassengers[index].seatNumber) {
      newPassengers[index].seatNumber = generateSeatNumber(value);
    }
    
    setFormData({ ...formData, passengers: newPassengers });
  };

  const handleContactChange = (field, value) => {
    setFormData({
      ...formData,
      contactInfo: { ...formData.contactInfo, [field]: value },
    });
  };

  const handlePreferenceChange = (field, value) => {
    setFormData({
      ...formData,
      seatPreferences: { ...formData.seatPreferences, [field]: value },
    });
  };

  const addPassenger = () => {
    setFormData({
      ...formData,
      passengers: [
        ...formData.passengers,
        {
          title: '',
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          passportNumber: '',
          nationality: '',
          seatNumber: '',
          seatClass: 'economy'
        },
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        userId: currentUser.uid,
        flightId: flight.id,
        flightDetails: flight,
        passengers: formData.passengers,
        contactInfo: formData.contactInfo,
        seatPreferences: formData.seatPreferences,
        status: 'pending',
        totalPrice: flight.price * formData.passengers.length,
        createdAt: serverTimestamp(),
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      navigate(`/bookings/${bookingRef.id}/payment`);
    } catch (error) {
      console.error('Error creating booking:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Flight Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
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
                <span className="ml-2 text-sm">{s}</span>
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

          <form onSubmit={handleSubmit}>
            {/* Step 1: Passenger Details */}
            {step === 1 && (
              <div className="space-y-6">
                {formData.passengers.map((passenger, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Passenger {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <select
                          value={passenger.title}
                          onChange={(e) =>
                            handlePassengerChange(index, 'title', e.target.value)
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          required
                        >
                          <option value="">Select</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={passenger.firstName}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              'firstName',
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={passenger.lastName}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              'lastName',
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={passenger.dateOfBirth}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              'dateOfBirth',
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                        >
                          <option value="economy" disabled={availableSeats.economy === 0}>
                            Economy {availableSeats.economy === 0 ? '(Full)' : ''}
                          </option>
                          <option value="business" disabled={availableSeats.business === 0}>
                            Business {availableSeats.business === 0 ? '(Full)' : ''}
                          </option>
                          <option value="first" disabled={availableSeats.first === 0}>
                            First Class {availableSeats.first === 0 ? '(Full)' : ''}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seat Number
                        </label>
                        <input
                          type="text"
                          value={passenger.seatNumber}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPassenger}
                  className="text-primary hover:text-primary-dark"
                >
                  + Add Another Passenger
                </button>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={formData.contactInfo.address}
                    onChange={(e) =>
                      handleContactChange('address', e.target.value)
                    }
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seat Preference
                  </label>
                  <select
                    value={formData.seatPreferences.seatType}
                    onChange={(e) =>
                      handlePreferenceChange('seatType', e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="window">Window</option>
                    <option value="aisle">Aisle</option>
                    <option value="middle">Middle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Meal Preference
                  </label>
                  <select
                    value={formData.seatPreferences.mealPreference}
                    onChange={(e) =>
                      handlePreferenceChange('mealPreference', e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="standard">Standard</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="halal">Halal</option>
                    <option value="kosher">Kosher</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.seatPreferences.specialAssistance}
                      onChange={(e) =>
                        handlePreferenceChange(
                          'specialAssistance',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Special Assistance Required
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
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