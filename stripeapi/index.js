require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.STRIPE_SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  next();
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
    const { amount, currency = 'usd', description } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
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

// Process refund
app.post('/refund', authenticateRequest, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    // First retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      throw new Error('No charge found for this payment intent');
    }

    // Create the refund
    const refund = await stripe.refunds.create({
      charge: paymentIntent.latest_charge,
      amount: amount || undefined,
      reason: reason || 'requested_by_customer'
    });

    res.json({
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
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