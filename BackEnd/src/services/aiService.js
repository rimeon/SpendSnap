/**
 * src/services/aiService.js — AI Intelligence Service (Using Gemini)
 */
const { GoogleGenAI } = require('@google/genai');

const extractJSON = (rawText) => {
  const jsonString = rawText
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(jsonString);
};

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const categorizeSubscription = async (serviceName) => {
  try {
    const ai = getAIClient();
    const prompt = `Classify the subscription service named "${serviceName}".
Use a strict category taxonomy (e.g., Entertainment, Productivity, Utilities, Health, Finance, Education, Software, Other).
Respond ONLY with a valid JSON object: {"category": "...", "subcategory": "..."}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const parsed = extractJSON(response.text?.trim() || '');
    const category = typeof parsed.category === 'string' && parsed.category.trim() ? parsed.category.trim() : 'Other';
    const subcategory = typeof parsed.subcategory === 'string' && parsed.subcategory.trim() ? parsed.subcategory.trim() : 'Other';
    return { category, subcategory };
  } catch (error) {
    console.error('⚠️ Gemini API categorization failed:', error.message);
    // Graceful fallback — return a generic category so the app keeps working
    return { category: 'Other', subcategory: 'General' };
  }
};

const fetchPricingFromAI = async (serviceName) => {
  try {
    const ai = getAIClient();
    const prompt = `Provide typical pricing plans for the subscription service "${serviceName}".
Respond ONLY with a valid JSON object: {"availablePlans": [{"planName": "Standard", "price": 9.99, "billingCycle": "monthly"}]}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const parsed = extractJSON(response.text?.trim() || '');
    return parsed.availablePlans || [];
  } catch (error) {
    console.error('⚠️ Gemini API pricing fetch failed:', error.message);
    // MOCK FALLBACK TO ALLOW UI TESTING
    return [
      { planName: "Basic (Mocked)", price: 9.99, billingCycle: "monthly" },
      { planName: "Pro (Mocked)", price: 14.99, billingCycle: "monthly" }
    ];
  }
};

const generateInsights = async (aggregatedData) => {
  try {
    const ai = getAIClient();
    const prompt = `Analyze this user's subscription spending data and provide 3 short, actionable financial insights. Data: ${JSON.stringify(aggregatedData)}. Respond ONLY with a valid JSON array of strings: ["Insight 1", "Insight 2", "Insight 3"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return extractJSON(response.text?.trim() || '');
  } catch (error) {
    console.error('⚠️ Gemini API insights failed:', error.message);
    const total = aggregatedData?.totalMonthlySpend || 0;
    const count = aggregatedData?.totalSubscriptions || 0;
    return [
      `You are spending ₹${total.toFixed(2)} per month on ${count} subscription${count !== 1 ? 's' : ''}.`,
      `Review your subscriptions regularly to cancel unused services and save money.`,
      `Consider consolidating streaming services — watching one at a time can reduce costs significantly.`
    ];
  }
};

const parseInvoice = async (fileDataBase64, mimeType) => {
  try {
    const ai = getAIClient();
    const prompt = `You are a receipt/invoice parser. Extract details from this subscription invoice.
Respond ONLY with a valid JSON object matching this schema:
{
  "serviceName": "Name of the subscription service (e.g. Netflix, Spotify, AWS, GitHub)",
  "amount": 9.99,
  "currency": "INR" or "USD" or "EUR" or "GBP" (3-letter currency code, default to INR if unclear),
  "billingCycle": "monthly" or "yearly" (determine based on typical subscription details in the invoice),
  "nextBillingDate": "YYYY-MM-DD" (calculate or extract next billing date; if not mentioned, default to 30 days after the invoice date in YYYY-MM-DD format)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          inlineData: {
            data: fileDataBase64,
            mimeType: mimeType
          }
        },
        prompt
      ]
    });

    const parsed = extractJSON(response.text?.trim() || '');
    return parsed;
  } catch (error) {
    console.error('⚠️ Gemini API invoice parsing failed:', error.message);
    throw new Error('Failed to parse invoice: ' + error.message);
  }
};

module.exports = { getAIClient, categorizeSubscription, fetchPricingFromAI, generateInsights, parseInvoice };

