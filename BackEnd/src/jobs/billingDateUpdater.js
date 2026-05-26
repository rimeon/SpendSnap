/**
 * src/jobs/billingDateUpdater.js — Subscription Lifecycle Cron Job
 *
 * Runs daily at 02:00 AM server time.
 * Finds all subscriptions whose nextBillingDate has passed and advances
 * it forward by full billing cycles until it is in the future.
 *
 * This prevents subscription data from going stale — without this job,
 * every nextBillingDate would be frozen at the date the user originally
 * entered, becoming increasingly wrong over time.
 *
 * BUG FIX: Replaced single-cycle advance with a while loop.
 * Previous behaviour: a subscription stale by 2 years (yearly cycle) would
 * take 730 daily cron runs to normalise — one year advanced per run.
 * Current behaviour: the while loop advances the full gap in a single run,
 * correctly handling any length of server downtime.
 */
const cron         = require('node-cron');
const Subscription = require('../models/Subscription');

const advanceStaleBillingDates = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Midnight — compare date only, not time

  try {
    const staleSubscriptions = await Subscription.find({
      nextBillingDate: { $lt: today },
    });

    if (staleSubscriptions.length === 0) {
      console.log('[CRON] billingDateUpdater — no stale dates found.');
      return;
    }

    let advancedCount = 0;
    for (const sub of staleSubscriptions) {
      const next = new Date(sub.nextBillingDate);

      // BUG FIX: while loop — advances all missed cycles in one run
      while (next < today) {
        if (sub.billingCycle === 'yearly') {
          next.setFullYear(next.getFullYear() + 1);
        } else {
          next.setMonth(next.getMonth() + 1);
        }
      }

      sub.nextBillingDate = next;
      await sub.save();
      advancedCount++;
    }

    console.log(`[CRON] billingDateUpdater — advanced ${advancedCount} subscription(s).`);
  } catch (err) {
    console.error('[CRON] billingDateUpdater — error:', err.message);
  }
};

// Schedule: 02:00 AM every day
// Format:   minute hour day month weekday
cron.schedule('0 2 * * *', advanceStaleBillingDates, {
  timezone: 'Asia/Kolkata', // IST — adjust per deployment region
});

// Export for manual invocation in tests or seeding scripts
module.exports = { advanceStaleBillingDates };
