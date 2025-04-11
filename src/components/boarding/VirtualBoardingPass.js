import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { FaPlane, FaQrcode, FaUser, FaMapMarkerAlt, FaClock, FaExchangeAlt } from 'react-icons/fa';

const VirtualBoardingPass = ({ bookingId }) => {
  const [boardingPass, setBoardingPass] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [updates, setUpdates] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (bookingId) {
      fetchBoardingPass();
      subscribeToUpdates();
    }
  }, [bookingId]);

  const fetchBoardingPass = async () => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const unsubscribe = onSnapshot(bookingRef, (doc) => {
        if (doc.exists()) {
          setBoardingPass({
            id: doc.id,
            ...doc.data()
          });
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching boarding pass:', error);
    }
  };

  const subscribeToUpdates = () => {
    try {
      const updatesRef = collection(db, 'flight_updates');
      const q = query(updatesRef, where('bookingId', '==', bookingId));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setUpdates(updatesData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error subscribing to updates:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!boardingPass) return null;

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
                  <h3 className="text-2xl font-bold">{boardingPass.flightDetails?.airline}</h3>
                  <p className="text-sm opacity-90">Flight {boardingPass.flightDetails?.flightNumber}</p>
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
                  <p className="text-3xl font-bold">{boardingPass.flightDetails?.departureCity}</p>
                  <p className="text-sm opacity-90">{formatTime(boardingPass.flightDetails?.departureTime)}</p>
                </div>
                <FaPlane className="mx-4 transform rotate-90" />
                <div className="text-center">
                  <p className="text-3xl font-bold">{boardingPass.flightDetails?.arrivalCity}</p>
                  <p className="text-sm opacity-90">{formatTime(boardingPass.flightDetails?.arrivalTime)}</p>
                </div>
              </div>
            </div>

            {/* Passenger Info */}
            <div className="p-6 border-b">
              <div className="flex items-center mb-4">
                <FaUser className="text-primary mr-2" />
                <h4 className="font-semibold">Passenger</h4>
              </div>
              {boardingPass.passengers?.map((passenger, index) => (
                <p key={index} className="text-gray-700">
                  {passenger.title} {passenger.firstName} {passenger.lastName}
                </p>
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
                  <span className="text-gray-600">Seat</span>
                </div>
                <span className="font-semibold">{boardingPass.seatNumber || 'Not Assigned'}</span>
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
                        {update.timestamp.toLocaleTimeString()}
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