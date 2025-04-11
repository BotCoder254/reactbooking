import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaPlane, FaCheck, FaTimes, FaBell, FaQrcode, FaSearch } from 'react-icons/fa';

const CheckInManager = () => {
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const flightsRef = collection(db, 'flights');
      const q = query(flightsRef, where('departureTime', '>=', today));
      const snapshot = await getDocs(q);

      const flightsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const flight = {
          id: doc.id,
          ...doc.data()
        };

        // Fetch check-in status for each flight
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(bookingsRef, where('flightId', '==', doc.id));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookings = bookingsSnapshot.docs.map(bookingDoc => ({
          id: bookingDoc.id,
          ...bookingDoc.data()
        }));

        return {
          ...flight,
          bookings,
          checkedIn: bookings.filter(b => b.checkedIn).length,
          totalPassengers: bookings.reduce((acc, b) => acc + (b.passengers?.length || 0), 0)
        };
      }));

      setFlights(flightsData.sort((a, b) => a.departureTime - b.departureTime));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId, status) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        checkedIn: status,
        checkInTime: status ? new Date() : null
      });

      // Add update notification
      await addDoc(collection(db, 'flight_updates'), {
        bookingId,
        message: status ? 'Check-in confirmed' : 'Check-in cancelled',
        timestamp: new Date(),
        type: 'check-in'
      });

      // Refresh flights data
      fetchFlights();
    } catch (error) {
      console.error('Error updating check-in status:', error);
    }
  };

  const handleSendUpdate = async (bookingId, message) => {
    try {
      await addDoc(collection(db, 'flight_updates'), {
        bookingId,
        message,
        timestamp: new Date(),
        type: 'update'
      });
    } catch (error) {
      console.error('Error sending update:', error);
    }
  };

  const filteredFlights = flights.filter(flight => 
    flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.departureCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.arrivalCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search flights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredFlights.map((flight) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Flight Header */}
              <div className="bg-gray-50 p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Flight {flight.flightNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {flight.departureCity} → {flight.arrivalCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Checked In: {flight.checkedIn}/{flight.totalPassengers}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(flight.departureTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="divide-y">
                {flight.bookings.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        {booking.passengers?.map((passenger, index) => (
                          <p key={index} className="text-gray-800">
                            {passenger.title} {passenger.firstName} {passenger.lastName}
                          </p>
                        ))}
                        <p className="text-sm text-gray-500">
                          Booking ID: {booking.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Send Update Button */}
                        <button
                          onClick={() => handleSendUpdate(booking.id, 'Please proceed to gate')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <FaBell />
                        </button>
                        
                        {/* Check-in Toggle */}
                        <button
                          onClick={() => handleCheckIn(booking.id, !booking.checkedIn)}
                          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                            booking.checkedIn
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {booking.checkedIn ? (
                            <>
                              <FaCheck className="mr-2" />
                              Checked In
                            </>
                          ) : (
                            <>
                              <FaTimes className="mr-2" />
                              Not Checked In
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckInManager; 