import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { FaPlane, FaQrcode, FaUser, FaMapMarkerAlt, FaClock, FaExchangeAlt, FaInfoCircle } from 'react-icons/fa';

const VirtualBoardingPass = ({ bookingId }) => {
  const [boardingPass, setBoardingPass] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [updates, setUpdates] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (bookingId) {
      const unsubscribe = fetchBoardingPass();
      const updateUnsubscribe = subscribeToUpdates();

      return () => {
        if (unsubscribe) unsubscribe();
        if (updateUnsubscribe) updateUnsubscribe();
      };
    }
  }, [bookingId]);

  const getDateFromField = (field) => {
    if (!field) return null;
    if (field instanceof Date) return field;
    if (typeof field.toDate === 'function') return field.toDate();
    if (typeof field === 'string') return new Date(field);
    return null;
  };

  const fetchBoardingPass = () => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      return onSnapshot(bookingRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setBoardingPass({
            id: doc.id,
            ...data,
            flightDetails: {
              ...data.flightDetails,
              departureTime: getDateFromField(data.flightDetails?.departureTime),
              arrivalTime: getDateFromField(data.flightDetails?.arrivalTime),
              boardingTime: getDateFromField(data.flightDetails?.boardingTime)
            }
          });
        }
      });
    } catch (error) {
      console.error('Error fetching boarding pass:', error);
      return null;
    }
  };

  const subscribeToUpdates = () => {
    try {
      const updatesRef = collection(db, 'flight_updates');
      const q = query(updatesRef, where('bookingId', '==', bookingId));
      
      return onSnapshot(q, (snapshot) => {
        const updatesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: getDateFromField(data.timestamp)
          };
        }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setUpdates(updatesData);
      });
    } catch (error) {
      console.error('Error subscribing to updates:', error);
      return null;
    }
  };

  const formatTime = (date) => {
    if (!date) return 'TBA';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    if (!date) return 'TBA';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPassengerSeats = (passengers) => {
    if (!passengers || passengers.length === 0) return 'Not Assigned';
    return passengers.map(p => p.seatNumber || 'Not Assigned').join(', ');
  };

  const getBoardingStatus = () => {
    if (!boardingPass?.flightDetails?.boardingTime) return null;
    const now = new Date();
    const boardingTime = new Date(boardingPass.flightDetails.boardingTime);
    const timeDiff = boardingTime - now;
    
    if (timeDiff > 1800000) { // More than 30 minutes
      return {
        message: `Boarding starts in ${Math.floor(timeDiff / 60000)} minutes`,
        color: 'text-blue-600'
      };
    } else if (timeDiff > 0) { // Less than 30 minutes
      return {
        message: 'Boarding soon',
        color: 'text-yellow-600'
      };
    } else if (timeDiff > -1800000) { // Within last 30 minutes
      return {
        message: 'Boarding now',
        color: 'text-green-600'
      };
    } else {
      return {
        message: 'Boarding closed',
        color: 'text-red-600'
      };
    }
  };

  if (!boardingPass) return null;

  const boardingStatus = getBoardingStatus();

  return (
    <div className="max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {showQR ? (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-lg p-8 text-center"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Scan at Check-in</h3>
            <div className="mb-6">
              <QRCodeSVG
                value={`BOARDING-${boardingPass.id}`}
                size={200}
                level="H"
                includeMargin={true}
                className="mx-auto"
              />
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="text-primary hover:text-primary-dark transition-colors"
            >
              Back to Details
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-white p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{boardingPass.flightDetails?.airline || 'Airline'}</h3>
                  <p className="text-sm opacity-90">Flight {boardingPass.flightDetails?.flightNumber || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setShowQR(true)}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                >
                  <FaQrcode size={24} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold">{boardingPass.flightDetails?.departureCity || 'DEP'}</p>
                  <p className="text-sm opacity-90">{formatTime(boardingPass.flightDetails?.departureTime)}</p>
                </div>
                <FaPlane className="mx-4 transform rotate-90" />
                <div className="text-center">
                  <p className="text-3xl font-bold">{boardingPass.flightDetails?.arrivalCity || 'ARR'}</p>
                  <p className="text-sm opacity-90">{formatTime(boardingPass.flightDetails?.arrivalTime)}</p>
                </div>
              </div>
            </div>

            {/* Boarding Status */}
            {boardingStatus && (
              <div className={`px-6 py-3 ${boardingStatus.color} bg-opacity-10 flex items-center justify-center`}>
                <FaInfoCircle className="mr-2" />
                <span className="font-medium">{boardingStatus.message}</span>
              </div>
            )}

            {/* Passenger Info */}
            <div className="p-6 border-b">
              <div className="flex items-center mb-4">
                <FaUser className="text-primary mr-2" />
                <h4 className="font-semibold">Passenger</h4>
              </div>
              {boardingPass.passengers?.map((passenger, index) => (
                <div key={index} className="text-gray-700 mb-2">
                  <p>{passenger.title} {passenger.firstName} {passenger.lastName}</p>
                  <p className="text-sm text-gray-500 ml-4">Seat: {passenger.seatNumber || 'Not Assigned'}</p>
                </div>
              ))}
            </div>

            {/* Flight Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-primary mr-2" />
                  <span className="text-gray-600">Gate</span>
                </div>
                <span className="font-semibold">{boardingPass.flightDetails?.gate || 'TBA'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaClock className="text-primary mr-2" />
                  <span className="text-gray-600">Boarding</span>
                </div>
                <span className="font-semibold">
                  {formatTime(boardingPass.flightDetails?.boardingTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaPlane className="text-primary mr-2" />
                  <span className="text-gray-600">Seats</span>
                </div>
                <span className="font-semibold text-right">
                  {formatPassengerSeats(boardingPass.passengers)}
                </span>
              </div>
            </div>

            {/* Updates Section */}
            {updates.length > 0 && (
              <div className="p-6 bg-blue-50">
                <div className="flex items-center mb-4">
                  <FaExchangeAlt className="text-primary mr-2" />
                  <h4 className="font-semibold">Latest Updates</h4>
                </div>
                <div className="space-y-2">
                  {updates.map((update) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-3 rounded-lg shadow-sm"
                    >
                      <p className="text-sm text-gray-800">{update.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {update.timestamp ? update.timestamp.toLocaleTimeString() : 'Just now'}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VirtualBoardingPass; 