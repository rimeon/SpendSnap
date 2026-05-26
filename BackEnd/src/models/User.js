/**
 * src/models/User.js — User Mongoose Schema
 *
 * Defines the shape of a user document in MongoDB.
 * Password is stored as a bcrypt hash — never plain text.
 * budgetLimit defaults to 0 so the field always exists.
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,            // Strip leading/trailing whitespace
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,           // Normalise email to lowercase before saving
      trim:      true,
    },
    password: {
      type:     String,
      required: [true, 'Password is required'],
    },
    budgetLimit: {
      type:    Number,
      default: 0,
      min:     [0, 'Budget limit cannot be negative'],
    },
    preferredCurrency: {
      type:    String,
      enum:    ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR',
    },
    categoryBudgets: [
      {
        category: { type: String, required: true },
        limit:    { type: Number, required: true, min: 0 },
      }
    ],
    cachedInsights: {
      type:    [String],
      default: [],
    },
    insightsLastUpdated: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }           // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('User', userSchema);
