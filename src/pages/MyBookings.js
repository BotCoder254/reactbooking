import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { FaPlane, FaCalendar, FaUser, FaTicketAlt, FaEye, FaHistory, FaDownload, FaMoneyBillWave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ETicketModal from '../components/flights/ETicketModal';
import RefundRequest from '../components/refunds/RefundRequest';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showETicket, setShowETicket] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const getDateFromField = (field) => {
    if (!field) return new Date();
    if (field instanceof Date) return field;
    if (typeof field.toDate === 'function') return field.toDate();
    if (typeof field === 'string') return new Date(field);
    return new Date();
  };

  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      // Get all bookings and handle different date formats
      let bookingsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: getDateFromField(data.createdAt),
          flightDetails: {
            ...data.flightDetails,
            departureTime: data.flightDetails?.departureTime ? 
              getDateFromField(data.flightDetails.departureTime) : null
          }
        };
      });

      // Sort bookings by date in memory
      bookingsData.sort((a, b) => b.createdAt - a.createdAt);
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openETicket = (booking) => {
    setSelectedBooking(booking);
    setShowETicket(true);
  };

  const openRefundRequest = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  const handleRefundSuccess = () => {
    setShowRefundModal(false);
    fetchBookings(); // Refresh bookings list
  };

  const canRequestRefund = (booking) => {
    return (
      booking.status === 'confirmed' &&
      !booking.refundStatus &&
      new Date(booking.flightDetails?.departureTime) > new Date()
    );
  };

  const getRefundStatus = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || '';
  };

  const BookingCard = ({ booking }) => {
    const isPastFlight = booking?.flightDetails?.departureTime ? 
      booking.flightDetails.departureTime < new Date() : false;
    const statusColor = 
      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800';
    
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return date instanceof Date ? 
        date.toLocaleDateString() : 
        new Date(date).toLocaleDateString();
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6 mb-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              {isPastFlight ? (
                <FaHistory className="text-primary mr-2" />
              ) : (
                <FaTicketAlt className="text-primary mr-2" />
              )}
              <h3 className="text-lg font-semibold text-gray-800">
                {isPastFlight ? 'Past Flight' : 'Upcoming Flight'} - #{booking.id?.substring(0, 8)}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-gray-600 mb-2">
                  <FaPlane className="mr-2" />
                  <span>
                    {booking.flightDetails?.departureCity || 'N/A'} → {booking.flightDetails?.arrivalCity || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <FaCalendar className="mr-2" />
                  <span>
                    {formatDate(booking.flightDetails?.departureTime)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-gray-600 mb-2">
                  <FaUser className="mr-2" />
                  <span>{booking.passengers?.length || 0} Passenger(s)</span>
                </div>
                <div className="text-primary font-semibold">
                  Total: ${booking.totalPrice?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end">
            <span className={`px-4 py-2 rounded-full text-sm ${statusColor}`}>
              {(booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)) || 'Unknown'}
            </span>
            {booking.refundStatus && (
              <span className={`mt-2 px-4 py-2 rounded-full text-sm ${getRefundStatus(booking.refundStatus)}`}>
                Refund {booking.refundStatus.charAt(0).toUpperCase() + booking.refundStatus.slice(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-2xl font-bold text-primary">
            ${booking.totalPrice?.toFixed(2) || '0.00'}
          </div>
          <div className="flex space-x-3">
            {booking.status === 'confirmed' && (
              <button
                onClick={() => openETicket(booking)}
                className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors"
              >
                <FaDownload className="mr-2" />
                E-Ticket
              </button>
            )}
            {canRequestRefund(booking) && (
              <button
                onClick={() => openRefundRequest(booking)}
                className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                <FaMoneyBillWave className="mr-2" />
                Request Refund
              </button>
            )}
            <button
              onClick={() => navigate(`/bookings/${booking.id}`)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              <FaEye className="mr-2" />
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View your flight history and manage bookings</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : bookings.length > 0 ? (
          <AnimatePresence>
            {bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-8 text-center"
          >
            <FaTicketAlt className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bookings Found</h3>
            <p className="text-gray-600">You haven't made any bookings yet.</p>
          </motion.div>
        )}

        <ETicketModal
          isOpen={showETicket}
          onClose={() => setShowETicket(false)}
          booking={selectedBooking}
        />

        {showRefundModal && (
          <RefundRequest
            booking={selectedBooking}
            onClose={() => setShowRefundModal(false)}
            onSuccess={handleRefundSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyBookings; 