import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaHistory, FaUser, FaBell } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.uid]);

  const dashboardCards = [
    {
      title: 'Upcoming Flights',
      icon: <FaPlane className="text-primary text-2xl" />,
      value: bookings.filter(b => new Date(b.departureDate) > new Date()).length,
      bgColor: 'bg-primary bg-opacity-10',
    },
    {
      title: 'Past Flights',
      icon: <FaHistory className="text-secondary text-2xl" />,
      value: bookings.filter(b => new Date(b.departureDate) < new Date()).length,
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

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user.name || 'Traveler'}!
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
                  {card.value}
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
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {booking.from} → {booking.to}
                        </p>
                        <p className="text-sm text-gray-600">
                          Flight {booking.flightNumber}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      {new Date(booking.departureDate).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm
                        ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="text-primary hover:text-primary-hover mr-3">
                        View Details
                      </button>
                      {new Date(booking.departureDate) > new Date() && (
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