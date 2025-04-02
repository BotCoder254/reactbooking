import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { FaPlane, FaCalendar, FaUser, FaTicketAlt } from 'react-icons/fa';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const BookingCard = ({ booking }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6 mb-4"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center mb-4">
            <FaTicketAlt className="text-primary mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">
              Booking #{booking.bookingReference}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-gray-600 mb-2">
                <FaPlane className="mr-2" />
                <span>{booking.flight.from} → {booking.flight.to}</span>
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <FaCalendar className="mr-2" />
                <span>{new Date(booking.flight.departureTime).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center text-gray-600 mb-2">
                <FaUser className="mr-2" />
                <span>{booking.passengers} Passenger(s)</span>
              </div>
              <div className="text-primary font-semibold">
                Total: ${booking.totalAmount}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-0 md:ml-6">
          <span className={`px-4 py-2 rounded-full text-sm ${
            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your flight bookings</p>
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
      </div>
    </DashboardLayout>
  );
};

export default MyBookings; 