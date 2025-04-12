require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./twitterclone-47ebf-firebase-adminsdk-ffeu2-4df411987e.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  try {
    // Get API key from Authorization header or x-api-key header
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] || 
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    // Allow public routes without authentication
    if (req.path === '/config' || req.path === '/') {
      return next();
    }

    // Check if API key is provided
    if (!apiKey) {
      console.error('No API key provided');
      return res.status(401).json({
        error: {
          message: 'Authentication required. Please provide a valid API key.',
          type: 'authentication_error'
        }
      });
    }

    // Verify API key matches either secret key or restricted key
    const validKey = process.env.STRIPE_SECRET_KEY;
    if (apiKey !== validKey) {
      console.error('Invalid API key provided');
      return res.status(401).json({
        error: {
          message: 'Invalid API key provided.',
          type: 'authentication_error'
        }
      });
    }

    // Store API key for use in route handlers
    req.stripeApiKey = apiKey;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: {
        message: 'Authentication failed.',
        type: 'authentication_error'
      }
    });
  }
};

// Serve the payment page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get Stripe publishable key
app.get('/config', (req, res) => {
  res.json({ 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY 
  });
});

// Create Payment Intent
app.post('/create-payment-intent', authenticateRequest, async (req, res) => {
  try {
    const { amount, currency = 'usd', description, bookingId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid amount',
          type: 'validation_error'
        }
      });
    }

    // Use the authenticated API key
    const stripeWithKey = stripe;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripeWithKey.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: { bookingId },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    if (bookingId) {
      await admin.firestore().collection('bookings').doc(bookingId).update({
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(400).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Process refund
app.post('/refund', authenticateRequest, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason, bookingId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: {
          message: 'Payment intent ID required',
          type: 'validation_error'
        }
      });
    }

    // First retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      throw new Error('No charge found');
    }

    // Create the refund
    const refund = await stripe.refunds.create({
      charge: paymentIntent.latest_charge,
      amount: amount || undefined,
      reason: reason || 'requested_by_customer'
    });

    // Update booking refund status
    if (bookingId) {
      await admin.firestore().collection('bookings').doc(bookingId).update({
        refundStatus: 'completed',
        refundAmount: refund.amount,
        refundId: refund.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(400).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Get refund status
app.get('/refund/:refundId', authenticateRequest, async (req, res) => {
  try {
    const refund = await stripe.refunds.retrieve(req.params.refundId);
    res.json(refund);
  } catch (error) {
    res.status(400).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Process partial refund
app.post('/partial-refund', authenticateRequest, async (req, res) => {
  try {
    const { paymentIntentId, amount, bookingId, adminId, reason } = req.body;

    // Validate required fields
    if (!paymentIntentId || !amount || !bookingId || !adminId) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields',
          code: 'missing_fields'
        }
      });
    }

    // Get payment intent to verify the payment exists
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({
        error: {
          message: 'Payment intent not found',
          code: 'payment_not_found'
        }
      });
    }

    // Create the refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
      reason: 'requested_by_customer'
    });

    // Update admin revenue statistics
    const adminRef = admin.firestore().collection('admins').doc(adminId);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      return res.status(404).json({
        error: {
          message: 'Admin record not found',
          code: 'admin_not_found'
        }
      });
    }

    // Batch update admin and booking
    const batch = admin.firestore().batch();
    
    batch.update(adminRef, {
      totalRevenue: admin.firestore.FieldValue.increment(-amount),
      totalRefunds: admin.firestore.FieldValue.increment(amount),
      refundCount: admin.firestore.FieldValue.increment(1)
    });

    const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
    batch.update(bookingRef, {
      refundStatus: 'partially_refunded',
      refundAmount: amount,
      refundDate: admin.firestore.FieldValue.serverTimestamp(),
      refundReason: reason || 'Customer request',
      refundId: refund.id
    });

    await batch.commit();

    res.json({
      success: true,
      refund: refund,
      status: refund.status
    });
  } catch (error) {
    console.error('Partial Refund Error:', error);
    res.status(400).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Webhook endpoint to handle Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Refund processed:', refund.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment status
app.get('/payment-status/:paymentIntentId', authenticateRequest, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (error) {
    res.status(400).json({
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Stripe API server running on port ${PORT}`);
});