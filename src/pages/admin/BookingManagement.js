import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { FaPlane, FaSearch, FaUser, FaClock, FaMoneyBill, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, confirmed, pending
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = setupRealtimeBookings();
    return () => unsubscribe();
  }, []);

  const setupRealtimeBookings = () => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          totalPrice: parseFloat(data.totalPrice || 0).toFixed(2),
          createdAt: data.createdAt || new Date().toISOString(),
          paidAt: data.paidAt || null,
          status: data.status || 'pending',
          flightDetails: {
            ...data.flightDetails,
            departureTime: data.flightDetails?.departureTime || null,
            arrivalTime: data.flightDetails?.arrivalTime || null,
            airline: data.flightDetails?.airline || 'N/A',
            flightNumber: data.flightDetails?.flightNumber || 'N/A',
            departureCity: data.flightDetails?.departureCity || 'N/A',
            arrivalCity: data.flightDetails?.arrivalCity || 'N/A'
          },
          passengerInfo: {
            ...data.passengerInfo,
            firstName: data.passengerInfo?.firstName || 'N/A',
            lastName: data.passengerInfo?.lastName || ''
          },
          selectedClass: data.selectedClass || 'Economy'
        };
      });
      setBookings(bookingsData);
      setLoading(false);
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking?.flightDetails?.airline?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking?.flightDetails?.flightNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking?.passengerInfo?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking?.passengerInfo?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    return matchesSearch && booking.status === filter;
  });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Management</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
                </div>
                <FaPlane className="text-2xl text-primary" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed Bookings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
                <FaMoneyBill className="text-2xl text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Bookings</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <FaClock className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('confirmed')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'confirmed'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flight Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                                <FaUser className="text-primary" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking?.passengerInfo?.firstName || 'N/A'} {booking?.passengerInfo?.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">
                                Booking #{booking.id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {booking?.flightDetails?.airline || 'N/A'} - {booking?.flightDetails?.flightNumber || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking?.flightDetails?.departureCity || 'N/A'} → {booking?.flightDetails?.arrivalCity || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking?.flightDetails?.departureTime ? formatDateTime(booking.flightDetails.departureTime) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            ${booking?.totalPrice || '0.00'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking?.selectedClass || 'N/A'} Class
                          </div>
                          {booking?.paymentId && (
                            <div className="text-xs text-gray-500">
                              Payment ID: {booking.paymentId.slice(0, 8)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking?.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(booking?.status || 'pending').charAt(0).toUpperCase() + (booking?.status || 'pending').slice(1)}
                          </span>
                          {booking?.paidAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Paid at: {new Date(booking.paidAt).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                            className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                          >
                            <FaEye className="mr-2" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default BookingManagement; 