/**
 * src/models/Subscription.js — Subscription Mongoose Schema
 *
 * Each document represents one recurring service a user is subscribed to.
 * Linked to a User via the userId reference (ObjectId).
 */
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User ID is required'],
      index:    true,            // Index for faster per-user queries
    },
    serviceName: {
      type:     String,
      required: [true, 'Service name is required'],
      trim:     true,
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      trim:     true,
    },
    subcategory: {
      type:     String,
      required: [true, 'Subcategory is required'],
      trim:     true,
    },
    planName: {
      type:    String,
      default: '',               // Optional — empty string is a valid default
      trim:    true,
    },
    amount: {
      type:     Number,
      required: [true, 'Amount is required'],
      min:      [0, 'Amount cannot be negative'],
    },
    currency: {
      type:     String,
      enum:     {
        values:  ['INR', 'USD', 'EUR', 'GBP'],
        message: 'Currency must be INR, USD, EUR, or GBP',
      },
      default:  'INR',
    },
    billingCycle: {
      type:     String,
      enum:     {
        values:  ['monthly', 'yearly'],
        message: 'Billing cycle must be monthly or yearly',
      },
      required: [true, 'Billing cycle is required'],
    },
    nextBillingDate: {
      type:     Date,
      required: [true, 'Next billing date is required'],
    },
  },
  { timestamps: true }           // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
