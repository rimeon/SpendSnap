/**
 * src/services/aiProvider.js — AI Provider Abstraction Layer
 *
 * Implements the Façade / Strategy pattern for AI operations.
 *
 * This module is the single entry point for all AI calls in the application.
 * It orchestrates two implementations:
 *   1. Gemini (primary)   — cloud AI via Google's API
 *   2. Rule-based engine  — deterministic fallback (zero cost, zero latency)
 *
 * The calling code (controllers, routes) never needs to know which
 * implementation ran. If Gemini fails or is rate-limited, the fallback
 * activates automatically and the response is still valid.
 *
 * To swap providers in future (e.g., swap Gemini for OpenAI):
 *   1. Create a new implementation file in /services/
 *   2. Import it here
 *   3. Replace the primary call — zero changes to calling code
 *
 * Public interface:
 *   categorize(serviceName)          → { category, subcategory }
 *   generateInsights(aggregatedData) → string[]
 *   parseInvoiceFile(base64, mime)   → { serviceName, amount, currency, billingCycle, nextBillingDate }
 *   parseEmailText(rawText)          → { serviceName, amount, currency, billingCycle, nextBillingDate }
 */
const geminiService   = require('./aiService');
const fallbackEngine  = require('./ruleBasedFallback');

// ─── categorize ───────────────────────────────────────────────────────────────
/**
 * Classify a service name into category + subcategory.
 * Gemini primary, rule-based fallback.
 */
const categorize = async (serviceName) => {
  try {
    const result = await geminiService.categorizeSubscription(serviceName);
    // If Gemini returns 'Other' for a known service, fall back to rule engine
    if (result.category === 'Other') {
      const fallback = fallbackEngine.categorize(serviceName);
      if (fallback.category !== 'Other') return fallback;
    }
    return result;
  } catch {
    return fallbackEngine.categorize(serviceName);
  }
};

// ─── generateInsights ─────────────────────────────────────────────────────────
/**
 * Generate 3 financial insights from aggregated subscription data.
 * Gemini primary, deterministic fallback.
 */
const generateInsights = async (aggregatedData) => {
  try {
    return await geminiService.generateInsights(aggregatedData);
  } catch {
    return fallbackEngine.generateInsights(aggregatedData);
  }
};

// ─── parseInvoiceFile ─────────────────────────────────────────────────────────
/**
 * Extract subscription details from a base64-encoded invoice file.
 * Gemini primary (multimodal), text-parsing fallback.
 */
const parseInvoiceFile = async (fileDataBase64, mimeType) => {
  return geminiService.parseInvoice(fileDataBase64, mimeType);
  // Note: file parsing has no useful rule-based fallback — binary content
  // requires multimodal AI. The error is surfaced to the user transparently.
};

// ─── parseEmailText ───────────────────────────────────────────────────────────
/**
 * Extract subscription details from raw email/invoice text.
 * Gemini primary, regex-based fallback.
 *
 * This powers the "email ingestion simulation" feature:
 * users paste email text or upload .eml files; this extracts the subscription.
 *
 * BUG FIX: Previously created a new GoogleGenAI client instance on every call
 * (a resource leak). Now reuses getAIClient() from aiService — the same
 * singleton used by all other AI operations in this codebase.
 */
const parseEmailText = async (rawText) => {
  try {
    // BUG FIX: use the shared client getter, not an inline re-instantiation
    const client = geminiService.getAIClient();

    const prompt = `You are a subscription receipt parser. Extract subscription details from this email text.
Respond ONLY with a valid JSON object:
{
  "serviceName": "Name of the service",
  "amount": 9.99,
  "currency": "INR",
  "billingCycle": "monthly",
  "nextBillingDate": "YYYY-MM-DD"
}

Email text:
${rawText.substring(0, 3000)}`; // Cap at 3000 chars to limit token cost

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const raw = response.text?.trim() || '';
    const jsonStr = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    // Deterministic regex fallback — always returns something useful
    return fallbackEngine.parseText(rawText);
  }
};

module.exports = { categorize, generateInsights, parseInvoiceFile, parseEmailText };
