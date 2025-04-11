import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaUsers, FaTicketAlt, FaChartLine, FaGift, FaCheckCircle, FaDoorOpen, FaMoneyBillWave } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { db } from '../../config/firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalUsers: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [bookingData, setBookingData] = useState({
    labels: [],
    datasets: [],
  });
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [],
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeStats = setupRealtimeStats();
    const unsubscribeBookings = setupRealtimeBookings();

    return () => {
      unsubscribeStats();
      unsubscribeBookings();
    };
  }, []);

  const setupRealtimeStats = () => {
    // Setup real-time listeners for collections
    const flightsUnsubscribe = onSnapshot(collection(db, 'flights'), (snapshot) => {
      updateStats('totalFlights', snapshot.size);
    });

    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      updateStats('totalUsers', snapshot.size);
    });

    const bookingsUnsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const confirmedBookings = snapshot.docs.filter(doc => doc.data().status === 'confirmed');
      const totalRevenue = confirmedBookings.reduce((acc, doc) => {
        return acc + (doc.data().totalPrice || 0);
      }, 0);

      updateStats('totalBookings', snapshot.size);
      updateStats('revenue', totalRevenue);
      updateChartData(snapshot.docs);
    });

    return () => {
      flightsUnsubscribe();
      usersUnsubscribe();
      bookingsUnsubscribe();
    };
  };

  const setupRealtimeBookings = () => {
    return onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

      setRecentBookings(bookings);
      setLoading(false);
    });
  };

  const updateStats = (key, value) => {
    setStats(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const updateChartData = (bookings) => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return getDateString(d);
    }).reverse();

    const bookingsByDay = last7Days.map(date => {
      const dayBookings = bookings.filter(doc => {
        const bookingData = doc.data();
        const createdAt = bookingData.createdAt;
        
        if (!createdAt) return false;

        let bookingDate;
        try {
          // Handle both timestamp and ISO string formats
          if (createdAt.toDate) {
            bookingDate = getDateString(createdAt.toDate());
          } else if (typeof createdAt === 'string') {
            bookingDate = createdAt.split('T')[0];
          } else {
            bookingDate = getDateString(new Date(createdAt));
          }
        } catch (error) {
          console.error('Error parsing date:', error);
          return false;
        }

        return bookingDate === date;
      });

      const confirmedBookings = dayBookings.filter(doc => doc.data().status === 'confirmed');
      
      return {
        date,
        count: dayBookings.length,
        revenue: confirmedBookings.reduce((acc, doc) => acc + (doc.data().totalPrice || 0), 0),
      };
    });

    setBookingData({
      labels: last7Days.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Bookings',
          data: bookingsByDay.map(d => d.count),
          borderColor: '#8F87F1',
          backgroundColor: '#8F87F1',
          tension: 0.4,
        },
      ],
    });

    setRevenueData({
      labels: last7Days.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Daily Revenue',
          data: bookingsByDay.map(d => d.revenue),
          backgroundColor: '#C68EFD',
        },
      ],
    });
  };

  const statsCards = [
    {
      title: 'Total Flights',
      icon: <FaPlane className="text-primary text-2xl" />,
      value: stats.totalFlights,
      bgColor: 'bg-primary bg-opacity-10',
    },
    {
      title: 'Total Users',
      icon: <FaUsers className="text-secondary text-2xl" />,
      value: stats.totalUsers,
      bgColor: 'bg-secondary bg-opacity-10',
    },
    {
      title: 'Total Bookings',
      icon: <FaTicketAlt className="text-accent text-2xl" />,
      value: stats.totalBookings,
      bgColor: 'bg-accent bg-opacity-10',
    },
    {
      title: 'Total Revenue',
      icon: <FaChartLine className="text-soft text-2xl" />,
      value: `$${stats.revenue.toLocaleString()}`,
      bgColor: 'bg-soft bg-opacity-10',
    },
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const adminLinks = [
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: <FaUsers className="text-4xl text-primary" />,
      path: '/admin/users'
    },
    {
      title: 'Flight Management',
      description: 'Add, edit, and manage flights',
      icon: <FaPlane className="text-4xl text-primary" />,
      path: '/admin/flights'
    },
    {
      title: 'Booking Management',
      description: 'View and manage flight bookings',
      icon: <FaTicketAlt className="text-4xl text-primary" />,
      path: '/admin/bookings'
    },
    {
      title: 'Offers Management',
      description: 'Create and manage special offers',
      icon: <FaGift className="text-4xl text-primary" />,
      path: '/admin/offers'
    },
    {
      title: 'Check-in Management',
      description: 'Manage passenger check-ins',
      icon: <FaCheckCircle className="text-4xl text-primary" />,
      path: '/admin/check-in'
    },
    {
      title: 'Boarding Management',
      description: 'Manage gates and boarding times',
      icon: <FaDoorOpen className="text-4xl text-primary" />,
      path: '/admin/boarding'
    },
    {
      title: 'Refund Management',
      description: 'Process and manage refund requests',
      icon: <FaMoneyBillWave className="text-4xl text-primary" />,
      path: '/admin/refunds'
    }
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
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage your flight booking system.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Booking Trends
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Line data={bookingData} options={chartOptions} />
          )}
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Revenue Analysis
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Bar data={revenueData} options={chartOptions} />
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Bookings
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : recentBookings.length > 0 ? (
          <ul className="space-y-4">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="flex items-center text-sm">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  booking.status === 'confirmed' ? 'bg-green-500' :
                  booking.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></span>
                <span className="text-gray-600">
                  {booking.flightDetails?.departureCity || 'N/A'} → {booking.flightDetails?.arrivalCity || 'N/A'}
                </span>
                <span className="ml-auto text-gray-400">{formatTimeAgo(booking.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No recent bookings
          </p>
        )}
      </motion.div>

      {/* Admin Links */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminLinks.map((link, index) => (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={link.path}
                className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col items-center text-center">
                  {link.icon}
                  <h3 className="mt-4 text-xl font-semibold">{link.title}</h3>
                  <p className="mt-2 text-gray-600">{link.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 