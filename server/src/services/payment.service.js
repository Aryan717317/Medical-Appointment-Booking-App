import stripe from '../config/stripe.js';

export const createPaymentIntent = async (amount, metadata = {}) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    capture_method: 'manual', // Don't capture immediately
    metadata
  });

  return paymentIntent;
};

export const capturePayment = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
};

export const cancelPayment = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
};

export const refundPayment = async (paymentIntentId, amount = null) => {
  const refundParams = {
    payment_intent: paymentIntentId
  };

  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  const refund = await stripe.refunds.create(refundParams);
  return refund;
};

export const getPaymentIntent = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
};
