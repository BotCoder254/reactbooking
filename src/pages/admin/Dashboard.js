import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaUsers, FaTicketAlt, FaChartLine } from 'react-icons/fa';
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
import { collection, getDocs } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  const fetchStats = async () => {
    try {
      const [flightsSnap, usersSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(db, 'flights')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'bookings')),
      ]);

      const totalRevenue = bookingsSnap.docs.reduce((acc, doc) => {
        return acc + (doc.data().price || 0);
      }, 0);

      setStats({
        totalFlights: flightsSnap.size,
        totalUsers: usersSnap.size,
        totalBookings: bookingsSnap.size,
        revenue: totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookings = bookingsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Process data for charts
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const bookingsByDay = last7Days.map(date => ({
        date,
        count: bookings.filter(b => b.createdAt?.split('T')[0] === date).length,
        revenue: bookings
          .filter(b => b.createdAt?.split('T')[0] === date)
          .reduce((acc, b) => acc + (b.price || 0), 0),
      }));

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
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
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
          Recent Activity
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ul className="space-y-4">
            <li className="flex items-center text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span className="text-gray-600">New user registration</span>
              <span className="ml-auto text-gray-400">2m ago</span>
            </li>
            <li className="flex items-center text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span className="text-gray-600">Flight booking completed</span>
              <span className="ml-auto text-gray-400">5m ago</span>
            </li>
            <li className="flex items-center text-sm">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              <span className="text-gray-600">New flight added</span>
              <span className="ml-auto text-gray-400">10m ago</span>
            </li>
          </ul>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 