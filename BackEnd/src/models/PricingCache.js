const mongoose = require('mongoose');

const pricingCacheSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      required: true,
      trim: true,
    },
    availablePlans: [
      {
        planName: { type: String, trim: true },
        price: { type: Number, required: true },
        billingCycle: {
          type: String,
          enum: ['monthly', 'yearly'],
          required: true,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['ai', 'api', 'manual'],
      default: 'ai',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingCache', pricingCacheSchema);
