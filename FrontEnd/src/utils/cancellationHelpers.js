/**
 * src/utils/cancellationHelpers.js — Subscription Cancellation Utilities
 *
 * Provides direct configuration links to cancel popular services and generating
 * customizable email cancellation requests.
 */

export const CANCEL_LINKS = {
  netflix: 'https://www.netflix.com/youraccount',
  spotify: 'https://www.spotify.com/account/overview/',
  youtube: 'https://www.youtube.com/paid_memberships',
  amazon: 'https://www.amazon.com/mc',
  hulu: 'https://secure.hulu.com/account',
  disney: 'https://www.disneyplus.com/account',
  apple: 'https://support.apple.com/billing',
  google: 'https://pay.google.com/',
  github: 'https://github.com/settings/billing',
  adobe: 'https://account.adobe.com/plans',
  figma: 'https://figma.com/settings',
  notion: 'https://notion.so/personal-settings',
  zoom: 'https://zoom.us/billing',
};

export const getCancelLink = (name = '') => {
  const norm = name.toLowerCase().trim();
  const match = Object.keys(CANCEL_LINKS).find(k => norm.includes(k));
  return match ? CANCEL_LINKS[match] : `https://www.google.com/search?q=how+to+cancel+${encodeURIComponent(name)}+subscription`;
};

export const generateEmailTemplate = (sub) => {
  const formattedDate = new Date(sub.nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const locale = sub.currency === 'INR' ? 'en-IN' : 'en-US';
  const formattedPrice = new Intl.NumberFormat(locale, { style: 'currency', currency: sub.currency || 'INR', maximumFractionDigits: 0 }).format(sub.amount || 0);
  
  return `Subject: Request for Subscription Cancellation - ${sub.serviceName}

Dear Customer Support Team,

I am writing to formally request the cancellation of my subscription for ${sub.serviceName}. 

Subscription Details:
- Plan Name: ${sub.planName || 'Standard'}
- Billing Amount: ${formattedPrice} (${sub.billingCycle})
- Associated Email: [Your account email]
- Next Billing Date: ${formattedDate}

Please terminate the subscription immediately and ensure that no further automatic charges are made to my payment method. If there was a recent automatic renewal that occurred without my active use, I kindly request a refund for that billing period.

Please send a written confirmation once this cancellation has been processed.

Thank you,
[Your Name]`;
};
