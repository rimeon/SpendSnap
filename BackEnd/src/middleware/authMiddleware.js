/**
 * src/middleware/authMiddleware.js — JWT Authentication Guard
 *
 * Reads the JWT from an httpOnly cookie ('token') set by the server.
 * Falls back to the Authorization: Bearer header for API tool compatibility.
 *
 * httpOnly cookies are inaccessible to JavaScript — eliminating the XSS
 * attack surface that comes with storing tokens in localStorage.
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Primary: read from httpOnly cookie (set by login/register endpoints)
  let token = req.cookies?.token;

  // Fallback: Authorization: Bearer <token> (useful for direct API testing)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized — no token provided'));
  }

  try {
    // Verify signature and expiry; throws if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user record (without the password hash) to the request
    const user = await User.findById(decoded.id).select('-password');

    // Guard against a valid token whose user was deleted from the DB
    if (!user) {
      res.status(401);
      return next(new Error('Not authorized — user no longer exists'));
    }

    req.user = user;
    return next(); // Token valid → proceed to the route handler
  } catch (error) {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError on failure
    res.status(401);
    return next(new Error('Not authorized — token invalid or expired'));
  }
};

module.exports = { protect };
