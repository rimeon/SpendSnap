/**
 * src/utils/currencyConverter.js — Currency Conversion Helper
 *
 * Implements conversion between INR, USD, EUR, and GBP.
 * Uses a static base rate dictionary (USD as base) for reliability and offline support.
 */

const EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
};

/**
 * Convert an amount from one currency to another.
 *
 * @param {number} amount — Amount to convert
 * @param {string} from — Source currency code (e.g. 'USD')
 * @param {string} to — Target currency code (e.g. 'INR')
 * @returns {number} Converted amount
 */
const convertCurrency = (amount, from = 'INR', to = 'INR') => {
  const fromUpper = (from || 'INR').toUpperCase();
  const toUpper = (to || 'INR').toUpperCase();

  if (fromUpper === toUpper) return amount;

  const fromRate = EXCHANGE_RATES[fromUpper] || 1.0;
  const toRate = EXCHANGE_RATES[toUpper] || 1.0;

  // Convert to USD base first, then convert to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
};

module.exports = {
  convertCurrency,
  EXCHANGE_RATES,
};
