import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaHistory, FaUser, FaBell } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;

    if (user?.uid) {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );

      unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt || new Date().toISOString()
        }));
        setBookings(bookingsData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching bookings:', error);
        setBookings([]);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const upcomingFlights = bookings.filter(b => 
    b.flightDetails?.departureTime && new Date(b.flightDetails.departureTime) > new Date()
  ).length;

  const pastFlights = bookings.filter(b => 
    b.flightDetails?.departureTime && new Date(b.flightDetails.departureTime) < new Date()
  ).length;

  const dashboardCards = [
    {
      title: 'Upcoming Flights',
      icon: <FaPlane className="text-primary text-2xl" />,
      value: upcomingFlights,
      bgColor: 'bg-primary bg-opacity-10',
    },
    {
      title: 'Past Flights',
      icon: <FaHistory className="text-secondary text-2xl" />,
      value: pastFlights,
      bgColor: 'bg-secondary bg-opacity-10',
    },
    {
      title: 'Profile Completion',
      icon: <FaUser className="text-accent text-2xl" />,
      value: '80%',
      bgColor: 'bg-accent bg-opacity-10',
    },
    {
      title: 'Notifications',
      icon: <FaBell className="text-soft text-2xl" />,
      value: '3',
      bgColor: 'bg-soft bg-opacity-10',
    },
  ];

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user?.name || 'Traveler'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your travel plans.
        </p>
      </motion.div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-lg ${card.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {loading ? '-' : card.value}
                </p>
              </div>
              {card.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Bookings
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 text-gray-600">Flight</th>
                  <th className="pb-3 text-gray-600">Date</th>
                  <th className="pb-3 text-gray-600">Status</th>
                  <th className="pb-3 text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5)
                  .map((booking) => (
                    <tr key={booking.id} className="border-b">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {booking.flightDetails?.departureCity || 'N/A'} → {booking.flightDetails?.arrivalCity || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Flight {booking.flightDetails?.flightNumber || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        {formatDateTime(booking.flightDetails?.departureTime)}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}
                        >
                          {booking.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                          className="text-primary hover:text-primary-hover mr-3"
                        >
                          View Details
                        </button>
                        {booking.status === 'pending' && new Date(booking.flightDetails?.departureTime) > new Date() && (
                          <button className="text-red-600 hover:text-red-700">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">
            No bookings found. Start planning your next trip!
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 