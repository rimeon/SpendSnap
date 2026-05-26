const express = require('express');
const router  = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login',    loginUser);
router.post('/logout',   logoutUser);           // Clears the auth cookie
router.get('/me',        protect, getCurrentUser); // Session restore on app load
router.put('/profile',   protect, updateUserProfile);

module.exports = router;
