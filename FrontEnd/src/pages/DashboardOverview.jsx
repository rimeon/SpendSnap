import { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBrandStyles } from '../utils/brandStyles';

const DashboardOverview = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [recentSubs, setRecentSubs] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, budgetRes, subsRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/budget'),
          api.get('/subscriptions')
        ]);
        setAnalytics(analyticsRes.data.data);
        setBudgetLimit(budgetRes.data.data.budgetLimit || 0);
        
        const allSubs = subsRes.data.data;
        const sortedSubs = [...allSubs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentSubs(sortedSubs.slice(0, 3));

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const next7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcoming = allSubs.filter(sub => {
          const nextBill = new Date(sub.nextBillingDate);
          return nextBill >= startOfToday && nextBill <= next7Days;
        }).sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate));

        setUpcomingRenewals(upcoming);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val, currencyCode = analytics?.preferredCurrency || 'INR') => {
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-800 border-t-[var(--accent)] rounded-full"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-sm mx-auto">
        <AlertCircle className="h-8 w-8 text-zinc-600" />
        <div>
          <p className="text-sm font-bold text-zinc-300">Failed to load dashboard</p>
          <p className="text-zinc-600 text-xs font-medium mt-1">Check your network connection or <Link to="/settings" className="text-[var(--accent)] hover:underline">re-authenticate</Link>.</p>
        </div>
        <button onClick={() => window.location.reload()} className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5 hover:underline cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const totalSpend = analytics?.totalMonthlySpend || 0;
  const isOverBudget = budgetLimit > 0 && totalSpend > budgetLimit;
  const greetingDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* ─── 1. PAGE HEADER ────────────────────────────────────────────────────── */}
      <header className="space-y-1">
        <span className="layout-label block">{greetingDate}</span>
        <h1 className="layout-hero text-white tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}.
        </h1>
        <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xl mt-1">
          Tracking {analytics?.totalSubscriptions || 0} subscriptions &mdash; {formatCurrency(totalSpend)} / mo.
          {upcomingRenewals.length > 0 && (
            <span className="text-zinc-400"> Next billing: <strong className="text-zinc-200 font-semibold">{upcomingRenewals[0].serviceName}</strong> on {new Date(upcomingRenewals[0].nextBillingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}.</span>
          )}
        </p>
      </header>

      {/* ─── 2. AI INSIGHTS STRIP ──────────────────────────────────────────────── */}
      {analytics?.insights?.length > 0 && (
        <div className="flex items-center gap-3 py-2.5 px-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg max-w-2xl text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
          <span className="font-medium truncate flex-1">"{analytics.insights[0]}"</span>
          <Link to="/analytics" className="text-[10px] font-bold tracking-wider text-[var(--accent)] uppercase shrink-0 hover:underline">
            View &rarr;
          </Link>
        </div>
      )}

      {/* ─── 3. STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Monthly Spending */}
        <div className="card-stat">
          <span className="layout-label block mb-3">Monthly Spending</span>
          <h2 className="layout-metric text-white">{formatCurrency(totalSpend)}</h2>
          <span className="text-zinc-500 text-xs font-medium block mt-1">Across {analytics?.totalSubscriptions || 0} active trackers</span>
        </div>

        {/* Budget limit */}
        <div className="card-stat">
          <span className="layout-label block mb-3">Monthly Budget</span>
          <div className="flex items-baseline gap-2.5">
            <h2 className="layout-metric text-white">{formatCurrency(budgetLimit)}</h2>
            {budgetLimit > 0 && (
              <span className={`text-xs font-semibold ${isOverBudget ? 'text-rose-400' : 'text-[var(--accent)]'}`}>
                {((totalSpend / budgetLimit) * 100).toFixed(0)}% used
              </span>
            )}
          </div>
          {budgetLimit > 0 && (
            <div className="mt-4">
              <div className="w-full bg-[var(--bg)] border border-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-[var(--accent)]'}`}
                  style={{ width: `${Math.min((totalSpend / budgetLimit) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-zinc-600 font-medium">Spend</span>
                <span className={`text-[10px] font-semibold ${isOverBudget ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {isOverBudget ? 'Limit exceeded' : `${formatCurrency(budgetLimit - totalSpend)} remaining`}
                </span>
              </div>
            </div>
          )}
          {budgetLimit === 0 && (
            <span className="text-zinc-600 text-xs font-medium block mt-1">No limit set</span>
          )}
        </div>

      </div>

      {/* ─── 4. RECENT ADDITIONS ───────────────────────────────────────────────── */}
      <div className="page-section">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Additions</h3>
            <p className="text-zinc-500 text-xs font-medium mt-0.5">Latest subscriptions added to your account</p>
          </div>
          <Link to="/subscriptions" className="text-xs font-semibold text-[var(--accent)] hover:underline">
            View all &rarr;
          </Link>
        </div>

        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg overflow-hidden">
          {recentSubs.length === 0 ? (
            <div className="text-zinc-600 text-xs font-medium py-8 text-center">No subscriptions yet.</div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentSubs.map((sub) => {
                const brand = getBrandStyles(sub.serviceName);
                return (
                  <div key={sub._id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-3)] transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0 ${brand.bg}`}>
                        {brand.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{sub.serviceName}</h4>
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide block mt-0.5">{sub.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(sub.amount, sub.currency)}</p>
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide block mt-0.5">{sub.billingCycle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardOverview;
