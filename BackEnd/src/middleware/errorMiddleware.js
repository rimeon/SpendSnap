/**
 * src/middleware/errorMiddleware.js — Global Error Handler
 *
 * Catches all errors forwarded via next(err) from any route or middleware.
 * Returns a consistent JSON error shape: { success, message }.
 *
 * Must be registered LAST in app.js (after all routes).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // If a controller already set an explicit HTTP status, use it; otherwise 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Expose stack trace only in development for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
