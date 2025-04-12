import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { FaLock, FaCreditCard, FaSpinner } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Configure axios defaults
const stripeApi = axios.create({
  baseURL: process.env.REACT_APP_STRIPE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.REACT_APP_STRIPE_SECRET_KEY}`
  }
});

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  // Initialize Stripe with publishable key
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const response = await stripeApi.get('/config');
        const stripe = await loadStripe(response.data.publishableKey);
        setStripePromise(stripe);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        setError('Failed to initialize payment system. Please try again.');
      }
    };

    initializeStripe();
  }, []);

  // Fetch booking details
  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  // Create payment intent when booking is loaded
  useEffect(() => {
    if (booking && !clientSecret) {
      createPaymentIntent();
    }
  }, [booking]);

  const fetchBookingDetails = async () => {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', id));
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        setBooking({
          id: bookingDoc.id,
          ...bookingData,
          totalPrice: bookingData.totalPrice || 0,
          passengers: bookingData.passengers || [],
          flightDetails: bookingData.flightDetails || {
            airline: 'N/A',
            flightNumber: 'N/A',
            departureCity: 'N/A',
            arrivalCity: 'N/A'
          }
        });
      } else {
        throw new Error('Booking not found');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError('Error loading booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    try {
      const response = await stripeApi.post('/create-payment-intent', {
        amount: Math.round(booking.totalPrice * 100), // Convert to cents
        currency: 'usd',
        description: `Flight booking ${booking.id}`,
        bookingId: booking.id
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      setClientSecret(response.data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError(error.message || 'Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Update booking status in Firestore
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentIntentId: paymentIntent.id,
        paidAmount: booking.totalPrice,
        paidAt: serverTimestamp()
      });

      // Navigate to success page
      navigate(`/payment-success/${id}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Payment successful but failed to update booking status');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FaCreditCard className="mx-auto text-4xl text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Error</h3>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/bookings')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
              <div className="flex items-center text-green-600">
                <FaLock className="mr-2" />
                <span className="text-sm">Secure Payment</span>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">Booking Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Flight</span>
                  <span>{booking?.flightDetails?.airline} - {booking?.flightDetails?.flightNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route</span>
                  <span>{booking?.flightDetails?.departureCity} → {booking?.flightDetails?.arrivalCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passengers</span>
                  <span>{booking?.passengers?.length || 0}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4">
                  <span>Total Amount</span>
                  <span>${booking?.totalPrice || 0}</span>
                </div>
              </div>
            </div>

            {stripePromise && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  processing={processing}
                  setProcessing={setProcessing}
                  onSuccess={handlePaymentSuccess}
                  onError={(msg) => setError(msg)}
                />
              </Elements>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

const PaymentForm = ({ processing, setProcessing, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment/success',
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        await onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <PaymentElement />
        </div>
      </div>

      <button
        type="submit"
        disabled={processing || !stripe}
        className={`w-full flex justify-center items-center bg-primary text-white py-3 rounded-lg transition-colors ${
          processing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-primary-hover'
        }`}
      >
        {processing ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </button>
    </form>
  );
};

export default PaymentPage; 