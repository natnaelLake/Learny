const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
router.post('/create-intent', protect, [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { amount, courseId } = req.body;

    // For now, return a mock payment intent
    // In production, you would integrate with Stripe or another payment processor
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    };

    res.json({
      success: true,
      data: paymentIntent
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', protect, [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required'),
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { paymentIntentId, courseId } = req.body;

    // For now, simulate payment confirmation
    // In production, you would verify the payment with your payment processor
    const payment = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 9900, // $99.00 in cents
      currency: 'usd',
      created: Date.now()
    };

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    // For now, return empty array
    // In production, you would fetch from your payment processor
    const payments = [];

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 