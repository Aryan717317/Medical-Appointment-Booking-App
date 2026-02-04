import express from 'express';
import Appointment from '../models/Appointment.js';
import stripe from '../config/stripe.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await Appointment.findOneAndUpdate(
        { 'payment.stripePaymentIntentId': paymentIntent.id },
        { 'payment.status': 'held' }
      );
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await Appointment.findOneAndUpdate(
        { 'payment.stripePaymentIntentId': failedPayment.id },
        { 
          'payment.status': 'failed',
          status: 'cancelled',
          cancelledBy: 'system',
          cancellationReason: 'Payment failed'
        }
      );
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      await Appointment.findOneAndUpdate(
        { 'payment.stripePaymentIntentId': refund.payment_intent },
        { 
          'payment.status': 'refunded',
          'payment.refundedAt': new Date()
        }
      );
      break;
  }

  res.json({ received: true });
});

// Get payment methods
router.get('/methods', authenticate, async (req, res, next) => {
  try {
    // Get or create Stripe customer
    let customerId = req.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: { userId: req.user._id.toString() }
      });
      customerId = customer.id;
      req.user.stripeCustomerId = customerId;
      await req.user.save();
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    next(error);
  }
});

// Create setup intent for saving card
router.post('/setup-intent', authenticate, async (req, res, next) => {
  try {
    let customerId = req.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        metadata: { userId: req.user._id.toString() }
      });
      customerId = customer.id;
      req.user.stripeCustomerId = customerId;
      await req.user.save();
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card']
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    next(error);
  }
});

// Delete payment method
router.delete('/methods/:id', authenticate, async (req, res, next) => {
  try {
    await stripe.paymentMethods.detach(req.params.id);
    res.json({ message: 'Payment method removed' });
  } catch (error) {
    next(error);
  }
});

export default router;
