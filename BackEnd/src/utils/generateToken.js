/**
 * src/utils/generateToken.js — JWT Generator
 *
 * Creates a signed JSON Web Token for a given user ID.
 * The token encodes only the user's MongoDB _id — no sensitive data.
 * Expires in 30 days; adjust via environment if needed.
 */
const jwt = require('jsonwebtoken');

/**
 * @param {string} id — MongoDB ObjectId of the authenticated user
 * @returns {string}   Signed JWT string
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

module.exports = generateToken;
