import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaPlane, FaEdit, FaSave, FaDoorOpen, FaClock, FaCalendar } from 'react-icons/fa';

const BoardingManager = () => {
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [boardingDetails, setBoardingDetails] = useState({
    gate: '',
    boardingTime: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const flightsRef = collection(db, 'flights');
      // Remove the date filter temporarily to see all flights
      const snapshot = await getDocs(flightsRef);

      const flightsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const flight = {
          id: doc.id,
          ...doc.data()
        };

        // Fetch bookings for each flight
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(bookingsRef, where('flightId', '==', doc.id));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return {
          ...flight,
          totalBookings: bookings.length,
          bookings
        };
      }));

      // Sort flights by departure time
      const sortedFlights = flightsData.sort((a, b) => {
        const dateA = a.departureTime?.toDate?.() || new Date(a.departureTime);
        const dateB = b.departureTime?.toDate?.() || new Date(b.departureTime);
        return dateA - dateB;
      });

      setFlights(sortedFlights);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setLoading(false);
    }
  };

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    setBoardingDetails({
      gate: flight.gate || '',
      boardingTime: flight.boardingTime ? new Date(flight.boardingTime.seconds * 1000).toISOString().slice(0, 16) : '',
      status: flight.status || 'scheduled'
    });
    setEditMode(false);
  };

  const handleSaveDetails = async () => {
    try {
      if (!selectedFlight) return;

      const flightRef = doc(db, 'flights', selectedFlight.id);
      const boardingTimeDate = new Date(boardingDetails.boardingTime);
      
      await updateDoc(flightRef, {
        gate: boardingDetails.gate,
        boardingTime: Timestamp.fromDate(boardingTimeDate),
        status: boardingDetails.status
      });

      // Update all related bookings
      const updatePromises = selectedFlight.bookings.map(booking => {
        return updateDoc(doc(db, 'bookings', booking.id), {
          'flightDetails.gate': boardingDetails.gate,
          'flightDetails.boardingTime': Timestamp.fromDate(boardingTimeDate),
          'flightDetails.status': boardingDetails.status
        });
      });

      await Promise.all(updatePromises);
      
      setEditMode(false);
      await fetchFlights(); // Refresh flight list
    } catch (error) {
      console.error('Error updating boarding details:', error);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Flight Management</h3>
        <div className="text-sm text-gray-600">
          Total Flights: {flights.length}
        </div>
      </div>

      {/* Flights List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : flights.length > 0 ? (
          flights.map((flight) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-colors ${
                selectedFlight?.id === flight.id ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleFlightSelect(flight)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Flight {flight.flightNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {flight.departureCity} → {flight.arrivalCity}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(flight.departureTime)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-600">
                    {flight.totalBookings} Bookings
                  </span>
                  <p className="text-xs text-gray-500">
                    Gate: {flight.gate || 'Not Assigned'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 bg-white rounded-lg shadow-sm">
            <FaPlane className="mx-auto text-gray-400 text-4xl mb-2" />
            <p className="text-gray-600">No flights found</p>
          </div>
        )}
      </div>

      {/* Boarding Details Editor */}
      {selectedFlight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-sm p-6 mt-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Boarding Details - Flight {selectedFlight.flightNumber}
            </h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center px-4 py-2 text-primary hover:bg-primary hover:bg-opacity-10 rounded-lg transition-colors"
            >
              {editMode ? (
                <>
                  <FaSave className="mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <FaEdit className="mr-2" />
                  Edit Details
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gate Assignment
              </label>
              <div className="flex items-center">
                <FaDoorOpen className="text-gray-400 mr-2" />
                {editMode ? (
                  <input
                    type="text"
                    value={boardingDetails.gate}
                    onChange={(e) => setBoardingDetails({ ...boardingDetails, gate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter gate number"
                  />
                ) : (
                  <span className="text-gray-800">{boardingDetails.gate || 'Not Assigned'}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boarding Time
              </label>
              <div className="flex items-center">
                <FaClock className="text-gray-400 mr-2" />
                {editMode ? (
                  <input
                    type="datetime-local"
                    value={boardingDetails.boardingTime}
                    onChange={(e) => setBoardingDetails({ ...boardingDetails, boardingTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <span className="text-gray-800">
                    {boardingDetails.boardingTime
                      ? new Date(boardingDetails.boardingTime).toLocaleString()
                      : 'Not Set'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {editMode && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveDetails}
                className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <FaSave className="mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BoardingManager; 
