import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, getDocs, updateDoc, doc, orderBy, where, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FaMoneyBill, FaCheck, FaTimes, FaSpinner, FaSearch, FaClock } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { auth } from '../../config/firebase';

// Stripe API configuration
const STRIPE_API_URL = process.env.REACT_APP_STRIPE_API_URL || 'http://localhost:3001';
const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Configure axios instance
const stripeApi = axios.create({
  baseURL: process.env.REACT_APP_STRIPE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_STRIPE_SECRET_KEY}`
  }
});

const RefundManager = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const refundsRef = collection(db, 'refunds');
      const q = query(refundsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const refundsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const refund = {
          id: doc.id,
          ...doc.data()
        };

        // Fetch associated booking details
        if (refund.bookingId) {
          const bookingDoc = await getDocs(query(
            collection(db, 'bookings'),
            where('__name__', '==', refund.bookingId)
          ));

          if (!bookingDoc.empty) {
            refund.booking = {
              id: bookingDoc.docs[0].id,
              ...bookingDoc.docs[0].data()
            };
          }
        }

        return refund;
      }));

      setRefunds(refundsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      setError('Failed to load refund requests. Please try again.');
      setLoading(false);
    }
  };

  const verifyPaymentAndProcess = async (paymentIntentId, amount) => {
    try {
      const response = await stripeApi.post('/partial-refund', {
        paymentIntentId,
        amount,
        bookingId: selectedRefund.bookingId,
        adminId: auth.currentUser.uid,
        reason: 'Approved by admin'
      });

      if (response.data.success) {
        return { success: true, refund: response.data.refund };
      }
      throw new Error(response.data.error?.message || 'Refund failed');
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  };

  const handleRefundAction = async (refundId, action, amount) => {
    try {
      setProcessing(true);
      const refundRef = doc(db, 'refunds', refundId);
      const refundDoc = await getDoc(refundRef);
      const refundData = refundDoc.data();

      if (action === 'approve') {
        const { success, refund } = await verifyPaymentAndProcess(
          refundData.paymentIntentId,
          amount || refundData.amount
        );

        if (success) {
          await updateDoc(refundRef, {
            status: 'approved',
            processedAt: serverTimestamp(),
            processedBy: auth.currentUser.uid,
            refundId: refund.id
          });

          toast.success('Refund approved and processed successfully');
        }
      } else if (action === 'reject') {
        await updateDoc(refundRef, {
          status: 'rejected',
          processedAt: serverTimestamp(),
          processedBy: auth.currentUser.uid,
          rejectionReason: 'Rejected by admin'
        });

        // Update booking status
        const bookingRef = doc(db, 'bookings', refundData.bookingId);
        await updateDoc(bookingRef, {
          refundStatus: 'rejected',
          updatedAt: serverTimestamp()
        });

        toast.success('Refund request rejected');
      }

      // Refresh refund requests
      fetchRefunds();
    } catch (error) {
      console.error('Error processing refund action:', error);
      toast.error(error.message || 'Failed to process refund action');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRefunds = refunds.filter(refund => 
    refund.booking?.flightDetails?.flightNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    refund.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'on_hold':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionButtons = (refund) => {
    if (refund.status === 'pending' || refund.status === 'on_hold') {
      return (
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={() => handleRefundAction(refund.id, 'reject', refund.amount)}
            disabled={processing}
            className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <FaTimes className="mr-2" />
            Reject
          </button>
          {refund.status === 'pending' && (
            <button
              onClick={() => handleRefundAction(refund.id, 'hold', refund.amount)}
              disabled={processing}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <FaClock className="mr-2" />
              On Hold
            </button>
          )}
          <button
            onClick={() => handleRefundAction(refund.id, 'approve', refund.amount)}
            disabled={processing}
            className="flex items-center px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            {processing ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaCheck className="mr-2" />
            )}
            Approve
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search refunds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRefunds.map((refund) => (
            <motion.div
              key={refund.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Flight {refund.booking?.flightDetails?.flightNumber}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {refund.booking?.flightDetails?.departureCity} → {refund.booking?.flightDetails?.arrivalCity}
                  </p>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-600">Reason:</span>
                    <span className="text-sm text-gray-800 ml-2">{refund.reason}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Requested: {new Date(refund.createdAt?.seconds * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(refund.status)}`}>
                    {refund.status?.charAt(0).toUpperCase() + refund.status?.slice(1)}
                  </span>
                  <p className="text-lg font-bold text-primary mt-2">
                    ${refund.amount?.toFixed(2)}
                  </p>
                </div>
              </div>

              {getActionButtons(refund)}
            </motion.div>
          ))}

          {filteredRefunds.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg">
              <FaMoneyBill className="mx-auto text-gray-400 text-4xl mb-2" />
              <p className="text-gray-600">No refund requests found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RefundManager; 