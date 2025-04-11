import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, orderBy, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaCheck, FaTimes, FaSpinner, FaSearch, FaChartLine, FaDollarSign, FaClock, FaExchangeAlt } from 'react-icons/fa';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const RefundManagement = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalRefunds: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    averageProcessingTime: 0
  });

  useEffect(() => {
    const unsubscribe = setupRealtimeRefunds();
    return () => unsubscribe();
  }, []);

  const setupRealtimeRefunds = () => {
    const refundsRef = collection(db, 'refunds');
    const q = query(refundsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, async (snapshot) => {
      try {
        const requests = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const refund = {
              id: doc.id,
              ...doc.data()
            };

            if (refund.bookingId) {
              const bookingDoc = await getDoc(doc(db, 'bookings', refund.bookingId));
              if (bookingDoc.exists()) {
                refund.booking = {
                  id: bookingDoc.id,
                  ...bookingDoc.data()
                };
              }
            }

            return refund;
          })
        );

        setRefundRequests(requests);
        calculateStats(requests);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching refund requests:', error);
        setLoading(false);
      }
    });
  };

  const calculateStats = (requests) => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending');
    const approved = requests.filter(r => r.status === 'approved');
    const pendingAmount = pending.reduce((sum, r) => sum + (r.amount || 0), 0);
    const approvedAmount = approved.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Calculate average processing time for completed refunds
    const processedRefunds = requests.filter(r => r.processedAt && r.createdAt);
    const avgTime = processedRefunds.reduce((sum, r) => {
      const processTime = (r.processedAt?.toDate?.() || new Date(r.processedAt)) - 
                         (r.createdAt?.toDate?.() || new Date(r.createdAt));
      return sum + processTime;
    }, 0) / (processedRefunds.length || 1);

    setStats({
      totalRefunds: total,
      pendingAmount,
      approvedAmount,
      averageProcessingTime: Math.round(avgTime / (1000 * 60 * 60)) // Convert to hours
    });
  };

  const handleRefundAction = async (refundId, status) => {
    setProcessing(true);
    try {
      const refund = refundRequests.find(r => r.id === refundId);
      if (!refund) return;

      const refundRef = doc(db, 'refunds', refundId);
      await updateDoc(refundRef, {
        status,
        processedAt: new Date()
      });

      if (refund.bookingId) {
        const bookingRef = doc(db, 'bookings', refund.bookingId);
        await updateDoc(bookingRef, {
          refundStatus: status
        });

        if (status === 'approved' && refund.paymentIntentId) {
          const response = await fetch('/refund', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: refund.paymentIntentId,
              amount: refund.amount * 100
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to process refund');
          }
        }
      }
    } catch (error) {
      console.error('Error updating refund status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = refundRequests.filter(request => 
    request.booking?.flightDetails?.flightNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.booking?.flightDetails?.departureCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.booking?.flightDetails?.arrivalCity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Refund Management</h1>
          <div className="relative w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search refunds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRefunds}</p>
              </div>
              <FaExchangeAlt className="text-primary text-xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <FaClock className="text-yellow-600 text-xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.approvedAmount)}</p>
              </div>
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Processing Time</p>
                <p className="text-2xl font-bold text-blue-600">{stats.averageProcessingTime}h</p>
              </div>
              <FaChartLine className="text-blue-600 text-xl" />
            </div>
          </motion.div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flight Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Passenger Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            Flight {request.booking?.flightDetails?.flightNumber}
                          </p>
                          <p className="text-gray-500">
                            {request.booking?.flightDetails?.departureCity} → {request.booking?.flightDetails?.arrivalCity}
                          </p>
                          <p className="text-gray-500">
                            {formatDate(request.booking?.flightDetails?.departureTime)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {request.booking?.passengers?.map((passenger, index) => (
                            <p key={index} className="text-gray-900">
                              {passenger.title} {passenger.firstName} {passenger.lastName}
                            </p>
                          ))}
                          <p className="text-gray-500 mt-1">
                            Booking ID: {request.bookingId?.substring(0, 8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">
                            {formatCurrency(request.amount)}
                          </p>
                          <p className="text-gray-500">{request.reason}</p>
                          <p className="text-gray-500 text-xs">
                            Requested: {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                          {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRefundAction(request.id, 'approved')}
                              disabled={processing}
                              className="flex items-center px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                            >
                              <FaCheck className="mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRefundAction(request.id, 'rejected')}
                              disabled={processing}
                              className="flex items-center px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            >
                              <FaTimes className="mr-1" />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No refund requests found
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RefundManagement; 
