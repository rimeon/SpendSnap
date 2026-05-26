/**
 * src/controllers/authController.js — Authentication Controller
 *
 * Security: JWTs are issued as httpOnly cookies (not in the response body).
 * httpOnly cookies are inaccessible to JavaScript, eliminating the XSS
 * attack surface that comes with localStorage token storage.
 *
 * Cookie flags:
 *   httpOnly  — JS cannot read it (XSS protection)
 *   secure    — HTTPS only in production
 *   sameSite  — blocks cross-site request forgery
 *   maxAge    — matches JWT expiry (30 days)
 */
const User          = require('../models/User');
const bcrypt        = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { logEvent }   = require('../utils/auditLogger');

// ─── Cookie Config Helper ─────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days in ms
};

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Builds the safe user payload returned to the client.
 * Token is NOT included here — it is set as an httpOnly cookie instead.
 */
const buildUserPayload = (user) => ({
  _id:               user.id,
  name:              user.name,
  email:             user.email,
  preferredCurrency: user.preferredCurrency,
});

// ─── Register ─────────────────────────────────────────────────────────────────
// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate all required fields are present and non-empty
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400);
      throw new Error('Please provide name, email and password');
    }

    // Reject weak passwords early (min 6 chars)
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    // Check for duplicate email (schema index also enforces this, but a
    // friendly error here is better than a Mongoose MongoServerError)
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('An account with that email already exists');
    }

    // Hash password with a cost factor of 10 (good balance of speed vs security)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Persist the new user
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // Set the JWT as an httpOnly cookie — never touches the client JS context
    res.cookie('token', generateToken(user._id), COOKIE_OPTIONS);

    logEvent({
      userId: user._id,
      action: 'USER_REGISTER',
      category: 'AUTH',
      req,
    });

    res.status(201).json({
      success: true,
      data:    buildUserPayload(user),
      message: 'Account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
// @desc   Authenticate an existing user and return a token
// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // BUG FIX: Validate fields before DB query
    if (!email?.trim() || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Look up the user by email (case-insensitive via lowercase normalisation)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Validate user existence and password in one step to prevent user-enumeration
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Set the JWT as an httpOnly cookie
    res.cookie('token', generateToken(user._id), COOKIE_OPTIONS);

    logEvent({
      userId: user._id,
      action: 'USER_LOGIN',
      category: 'AUTH',
      req,
    });

    res.status(200).json({
      success: true,
      data:    buildUserPayload(user),
      message: 'Logged in successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// @desc   Clear the auth cookie to log the user out
// @route  POST /api/auth/logout
// @access Public
const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Current User ─────────────────────────────────────────────────────────
// @desc   Return the currently authenticated user (used to restore session on
//         app load — the frontend calls this instead of reading localStorage)
// @route  GET /api/auth/me
// @access Private
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware after cookie verification
    res.status(200).json({
      success: true,
      data:    buildUserPayload(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
// @desc   Update user profile settings
// @route  PUT /api/auth/profile
// @access Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, email, password, preferredCurrency } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400);
        throw new Error('Name cannot be empty');
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      if (!emailLower) {
        res.status(400);
        throw new Error('Email cannot be empty');
      }
      if (emailLower !== user.email) {
        const emailExists = await User.findOne({ email: emailLower });
        if (emailExists) {
          res.status(400);
          throw new Error('An account with that email already exists');
        }
        user.email = emailLower;
      }
    }

    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
      }
      user.password = await bcrypt.hash(password, 10);
    }

    if (preferredCurrency !== undefined) {
      const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
      if (!validCurrencies.includes(preferredCurrency.toUpperCase())) {
        res.status(400);
        throw new Error('Preferred currency must be INR, USD, EUR, or GBP');
      }
      user.preferredCurrency = preferredCurrency.toUpperCase();
    }

    const updatedUser = await user.save();

    // Re-issue cookie if password changed (invalidates old sessions gracefully)
    if (req.body.password) {
      res.cookie('token', generateToken(updatedUser._id), COOKIE_OPTIONS);
    }

    res.status(200).json({
      success: true,
      data: buildUserPayload(updatedUser),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, logoutUser, getCurrentUser, updateUserProfile };
