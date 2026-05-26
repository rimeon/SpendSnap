/**
 * src/config/db.js — MongoDB Connection
 *
 * Uses Mongoose to connect to MongoDB. Exits the process on failure
 * so the app never starts in a broken state.
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log a descriptive error and kill the process — do not start with no DB
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
