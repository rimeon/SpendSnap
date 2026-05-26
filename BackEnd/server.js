/**
 * server.js — Application Entry Point
 *
 * Loads environment variables first (MUST be before any other require),
 * then boots the Express app and connects to MongoDB.
 */
require('dotenv').config();

const app       = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Establish MongoDB connection before starting the HTTP server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
  });
});
