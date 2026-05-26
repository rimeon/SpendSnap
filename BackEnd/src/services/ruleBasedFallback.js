/**
 * src/services/ruleBasedFallback.js — Deterministic AI Fallback Engine
 *
 * Provides rule-based implementations for all AI operations.
 * Activated automatically when Gemini is unavailable or rate-limited.
 *
 * Design: every function in this module mirrors the interface of the
 * Gemini implementation in aiService.js — the caller never knows which
 * one ran. This is the Façade / Strategy pattern applied to AI providers.
 *
 * Portfolio note: this demonstrates that the AI layer is an optional
 * enrichment, not a hard dependency — the system degrades gracefully.
 */

// ─── Category Keyword Map ─────────────────────────────────────────────────────
const CATEGORY_RULES = [
  { keywords: ['netflix', 'hotstar', 'prime', 'hulu', 'disney', 'zee5', 'sonyliv', 'jiocinema', 'apple tv'], category: 'Entertainment', subcategory: 'Streaming' },
  { keywords: ['spotify', 'apple music', 'gaana', 'jiosaavn', 'amazon music', 'youtube music', 'tidal'], category: 'Entertainment', subcategory: 'Music' },
  { keywords: ['xbox', 'playstation', 'ps plus', 'ea play', 'game pass', 'steam', 'nvidia now', 'geforce'], category: 'Entertainment', subcategory: 'Gaming' },
  { keywords: ['notion', 'slack', 'zoom', 'microsoft 365', 'office', 'teams', 'figma', 'linear', 'jira', 'trello', 'monday', 'asana', 'clickup'], category: 'Productivity', subcategory: 'Tools' },
  { keywords: ['github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'heroku', 'digitalocean', 'aws', 'azure', 'gcp', 'render', 'railway'], category: 'Developer Tools', subcategory: 'Cloud' },
  { keywords: ['adobe', 'canva', 'sketch', 'invision', 'framer', 'webflow'], category: 'Design', subcategory: 'Creative' },
  { keywords: ['dropbox', 'google one', 'icloud', 'onedrive', 'box'], category: 'Productivity', subcategory: 'Cloud Storage' },
  { keywords: ['coursera', 'udemy', 'pluralsight', 'linkedin learning', 'skillshare', 'duolingo', 'byjus', 'unacademy'], category: 'Education', subcategory: 'Learning' },
  { keywords: ['youtube', 'youtube premium'], category: 'Entertainment', subcategory: 'Video' },
  { keywords: ['nytimes', 'wsj', 'economist', 'medium', 'substack', 'hindustan times', 'the hindu'], category: 'News & Media', subcategory: 'News' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'ajio'], category: 'Shopping', subcategory: 'E-commerce' },
  { keywords: ['zomato', 'swiggy', 'dunzo'], category: 'Food & Delivery', subcategory: 'Food Delivery' },
  { keywords: ['gym', 'cult.fit', 'fitness', 'headspace', 'calm', 'noom'], category: 'Health & Fitness', subcategory: 'Wellness' },
  { keywords: ['insurance', 'policybazaar', 'digit', 'acko'], category: 'Finance', subcategory: 'Insurance' },
  { keywords: ['airtel', 'jio', 'vi ', 'bsnl', 'broadband', 'wifi', 'internet'], category: 'Utilities', subcategory: 'Internet' },
  { keywords: ['antivirus', 'norton', 'mcafee', 'kaspersky', '1password', 'lastpass', 'bitwarden'], category: 'Software', subcategory: 'Security' },
];

// ─── Categorize ───────────────────────────────────────────────────────────────
const categorize = (serviceName) => {
  const lower = serviceName.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return { category: rule.category, subcategory: rule.subcategory };
    }
  }
  return { category: 'Other', subcategory: 'General' };
};

// ─── Generate Insights (Deterministic) ───────────────────────────────────────
const generateInsights = (aggregatedData) => {
  const { totalMonthlySpend = 0, totalSubscriptions = 0, categoryBreakdown = [], highCostServices = [], preferredCurrency = 'INR' } = aggregatedData;

  const insights = [];
  const currency = preferredCurrency;

  // Insight 1: Monthly spend overview
  insights.push(
    `You have ${totalSubscriptions} active subscription${totalSubscriptions !== 1 ? 's' : ''}, ` +
    `totalling ${currency} ${totalMonthlySpend.toFixed(2)}/month ` +
    `(${currency} ${(totalMonthlySpend * 12).toFixed(2)}/year).`
  );

  // Insight 2: Highest spend category
  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    const pct = totalMonthlySpend > 0 ? ((top.amount / totalMonthlySpend) * 100).toFixed(0) : 0;
    insights.push(
      `Your biggest spending category is ${top.category} at ${currency} ${top.amount.toFixed(2)}/month (${pct}% of total spend).`
    );
  }

  // Insight 3: Most expensive single service
  if (highCostServices.length > 0) {
    const top = highCostServices[0];
    insights.push(
      `${top.serviceName} is your most expensive subscription at ${currency} ${top.amount.toFixed(2)}/month.`
    );
  }

  // Insight 4: Streaming overlap warning
  const streamingServices = (categoryBreakdown || []).filter(c =>
    ['Entertainment', 'Streaming'].includes(c.category)
  );
  if (streamingServices.length > 0 && totalSubscriptions >= 3) {
    insights.push(
      `Consider auditing your Entertainment subscriptions — watching one service at a time could free up ${currency} ${(streamingServices.reduce((a,c) => a+c.amount, 0) * 0.5).toFixed(0)}/month.`
    );
  }

  return insights.slice(0, 3);
};

// ─── Parse Text (Email/Invoice) — Rule-Based ──────────────────────────────────
const parseText = (text) => {
  // Basic pattern extraction: amount, service name, date
  const amountMatch = text.match(/(?:INR|₹|Rs\.?|USD|\$|EUR|€|GBP|£)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  const currencyMatch = text.match(/\b(INR|USD|EUR|GBP)\b/i);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'INR';

  const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  const dateRaw = dateMatch ? dateMatch[0] : null;

  // Billing cycle detection
  const isYearly = /annual|yearly|per year|12.month/i.test(text);
  const billingCycle = isYearly ? 'yearly' : 'monthly';

  // Service name: try to find known service in text
  const lower = text.toLowerCase();
  let serviceName = 'Unknown Service';
  for (const rule of CATEGORY_RULES) {
    const match = rule.keywords.find(k => lower.includes(k));
    if (match) {
      serviceName = match.charAt(0).toUpperCase() + match.slice(1);
      break;
    }
  }

  // nextBillingDate: 30 days from today if not found
  let nextBillingDate;
  try {
    nextBillingDate = dateRaw ? new Date(dateRaw).toISOString().split('T')[0] : null;
  } catch { nextBillingDate = null; }

  if (!nextBillingDate) {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    nextBillingDate = d.toISOString().split('T')[0];
  }

  return { serviceName, amount, currency, billingCycle, nextBillingDate };
};

module.exports = { categorize, generateInsights, parseText };
