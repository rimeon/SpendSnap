import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Activity, Loader2, PieChart, TrendingDown, TrendingUp, Sparkles, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHART_COLORS = [
  'var(--accent)', 
  '#a78bfa', // Soft Violet
  '#3b82f6', // Soft Blue
  '#06b6d4', // Soft Cyan
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#10b981', // Emerald
];

const EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
};

const convertCurrency = (amount, from = 'INR', to = 'INR') => {
  const fromUpper = (from || 'INR').toUpperCase();
  const toUpper = (to || 'INR').toUpperCase();
  if (fromUpper === toUpper) return amount;
  const fromRate = EXCHANGE_RATES[fromUpper] || 1.0;
  const toRate = EXCHANGE_RATES[toUpper] || 1.0;
  return (amount / fromRate) * toRate;
};

// Generates SVG path data with smooth Bezier control points
const getBezierPath = (points) => {
  if (points.length === 0) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  return path;
};

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCycle, setSelectedCycle] = useState('All');

  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, subsRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/subscriptions')
        ]);
        setAnalytics(analyticsRes.data.data);
        setAllSubscriptions(subsRes.data.data);
        if (analyticsRes.data.data.insights) {
          setAiInsights(analyticsRes.data.data.insights);
        }
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val) => {
    const currencyCode = analytics?.preferredCurrency || 'INR';
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val || 0);
  };

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const res = await api.post('/ai/insights');
      setAiInsights(res.data.data);
    } catch (err) {
      console.error('Failed to generate insights', err);
      alert('Failed to generate AI insights.');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-[var(--accent)]" /></div>;
  }

  if (!analytics || allSubscriptions.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-950/40 rounded-3xl border border-white/[0.03] max-w-2xl mx-auto mt-12">
        <PieChart className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-zinc-300">No data available</h2>
        <p className="text-zinc-500 font-medium text-xs mt-1">Configure active subscriptions to unlock analytics charts.</p>
      </div>
    );
  }

  const preferredCurrency = analytics?.preferredCurrency || 'INR';

  const filteredSubs = allSubscriptions.filter(sub => {
    const matchCategory = selectedCategory === 'All' || sub.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchCycle = selectedCycle === 'All' || sub.billingCycle.toLowerCase() === selectedCycle.toLowerCase();
    return matchCategory && matchCycle;
  });

  const totalMonthlySpend = filteredSubs.reduce((acc, sub) => {
    const originalCost = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount;
    const convertedCost = convertCurrency(originalCost, sub.currency || 'INR', preferredCurrency);
    return acc + convertedCost;
  }, 0);

  const categoryBreakdownMap = {};
  filteredSubs.forEach(sub => {
    const originalCost = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount;
    const convertedCost = convertCurrency(originalCost, sub.currency || 'INR', preferredCurrency);
    categoryBreakdownMap[sub.category] = (categoryBreakdownMap[sub.category] || 0) + convertedCost;
  });

  const categoryBreakdown = Object.keys(categoryBreakdownMap).map(cat => ({
    category: cat,
    amount: categoryBreakdownMap[cat]
  })).sort((a, b) => b.amount - a.amount);

  const uniqueCategories = ['All', ...new Set(allSubscriptions.map(sub => sub.category))];

  const getPast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
      });
    }
    return months;
  };

  const monthsData = getPast6Months().map(m => {
    const monthEnd = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59);
    const total = filteredSubs.reduce((acc, sub) => {
      const created = new Date(sub.createdAt || sub.nextBillingDate);
      if (created <= monthEnd) {
        const originalCost = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount;
        const convertedCost = convertCurrency(originalCost, sub.currency || 'INR', preferredCurrency);
        return acc + convertedCost;
      }
      return acc;
    }, 0);
    return { label: m.name, value: total };
  });

  const lineValues = monthsData.map(d => d.value);
  const maxLineValue = Math.max(...lineValues, 100);

  const getSvgY = (val) => {
    if (maxLineValue === 0) return 150;
    return 150 - (val / maxLineValue) * 110; 
  };

  const linePoints = monthsData.map((d, idx) => {
    const x = 50 + idx * 78; 
    const y = getSvgY(d.value);
    return { x, y, label: d.label, value: d.value };
  });

  const bezierPath = getBezierPath(linePoints);
  const areaPath = linePoints.length > 0 
    ? `${bezierPath} L ${linePoints[linePoints.length - 1].x} 150 L ${linePoints[0].x} 150 Z` 
    : '';

  const radius = 35;
  const circumference = 2 * Math.PI * radius; 
  // Build donut segments using a running accumulated percent (pure, no mutation)
  let runningPercent = 0;
  const segments = categoryBreakdown.map((item, index) => {
    const percent = totalMonthlySpend > 0 ? (item.amount / totalMonthlySpend) * 100 : 0;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    const strokeDasharray = `${circumference} ${circumference}`;
    const angle = (runningPercent / 100) * 360 - 90;
    runningPercent = runningPercent + percent;

    return {
      ...item,
      percent,
      strokeDasharray,
      strokeDashoffset,
      angle,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  const upcomingRenewals = filteredSubs.map(sub => {
    const nextBill = new Date(sub.nextBillingDate);
    const today = new Date();
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(nextBill.getFullYear(), nextBill.getMonth(), nextBill.getDate());
    const diffTime = d2 - d1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...sub,
      daysRemaining: diffDays
    };
  }).filter(sub => sub.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 4);

  const getDaysText = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} d`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 page-header">
        <div className="space-y-1">
          <span className="layout-label">Spending Analysis</span>
          <h1 className="display-section text-white">Analytics</h1>
          <p className="text-[var(--text-2)] text-sm font-medium mt-1">Visualize category splits, spending trends, and upcoming renewals.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="appearance-none bg-[var(--surface-2)] border border-[var(--border)] text-zinc-200 hover:text-white font-medium rounded-lg py-2.5 pl-9 pr-9 focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer text-sm transition-colors"
            >
              <option value="All" className="bg-[#121316] text-[#f5f5f5]">All Categories</option>
              {uniqueCategories.filter(cat => cat !== 'All').map(cat => (
                <option key={cat} value={cat} className="bg-[#121316] text-[#f5f5f5]">{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedCycle}
              onChange={e => setSelectedCycle(e.target.value)}
              className="appearance-none bg-[var(--surface-2)] border border-[var(--border)] text-zinc-200 hover:text-white font-medium rounded-lg py-2.5 pl-4 pr-9 focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer text-sm transition-colors"
            >
              <option value="All" className="bg-[#121316] text-[#f5f5f5]">All Cycles</option>
              <option value="monthly" className="bg-[#121316] text-[#f5f5f5]">Monthly</option>
              <option value="yearly" className="bg-[#121316] text-[#f5f5f5]">Yearly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── INLINE METRICS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-stat">
          <span className="layout-label block mb-2">Monthly Spend</span>
          <h3 className="text-xl font-bold text-white leading-none">{formatCurrency(totalMonthlySpend)}</h3>
        </div>
        <div className="card-stat">
          <span className="layout-label block mb-2">Subscriptions</span>
          <h3 className="text-xl font-bold text-white leading-none">{filteredSubs.length}</h3>
        </div>
        <div className="card-stat">
          <span className="layout-label block mb-2">Period</span>
          <h3 className="text-xl font-bold text-white leading-none">6 Months</h3>
        </div>
      </div>

      {/* ─── CHART CENTERPIECE AREA (NO BOXES / FLAT INTEGRATED) ──────────────── */}
      <div className="w-full relative py-6">
        <svg viewBox="0 0 500 180" className="w-full overflow-visible">
          {/* Subtle horizontal grid lines */}
          <line x1="45" y1="40" x2="460" y2="40" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
          <line x1="45" y1="95" x2="460" y2="95" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
          <line x1="45" y1="150" x2="460" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Y Axis labels */}
          <text x="35" y="44" fill="#52525b" className="text-[7.5px] font-bold" textAnchor="end">{formatCurrency(maxLineValue)}</text>
          <text x="35" y="99" fill="#52525b" className="text-[7.5px] font-bold" textAnchor="end">{formatCurrency(maxLineValue / 2)}</text>
          <text x="35" y="154" fill="#52525b" className="text-[7.5px] font-bold" textAnchor="end">{formatCurrency(0)}</text>

          <defs>
            <linearGradient id="chartCurveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Filled Spline Area */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chartCurveGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Smooth Spline Curve */}
          {bezierPath && (
            <path
              d={bezierPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          )}

          {/* Glowing points */}
          {linePoints.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredLineIndex === idx ? "5" : "3.5"}
                fill="#09090b"
                stroke={hoveredLineIndex === idx ? "var(--accent)" : "#52525b"}
                strokeWidth={hoveredLineIndex === idx ? "2.5" : "1.5"}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredLineIndex(idx)}
                onMouseLeave={() => setHoveredLineIndex(null)}
              />
              <text
                x={pt.x}
                y="168"
                fill="#52525b"
                className="text-[8px] font-bold"
                textAnchor="middle"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredLineIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -5 }}
              className="absolute bg-zinc-950 border border-white/[0.04] px-3 py-1.5 rounded-lg text-center shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-full z-10"
              style={{
                left: `${(linePoints[hoveredLineIndex].x / 500) * 100}%`,
                top: `${(linePoints[hoveredLineIndex].y / 180) * 100 - 3}%`
              }}
            >
              <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
                {linePoints[hoveredLineIndex].label} expenditure
              </p>
              <p className="text-xs font-black text-white leading-none">
                {formatCurrency(linePoints[hoveredLineIndex].value)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── CONTEXTUAL SUPPORT AREA ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 page-section">
        
        {/* Category breakdown (Subtle left column structure) */}
        <div className="space-y-4">
          <h3 className="layout-label text-white">Segment Share</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {filteredSubs.length === 0 ? (
              <div className="text-zinc-500 text-xs font-semibold py-4">No categories segmented.</div>
            ) : (
              <>
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#0b0b0c" strokeWidth="6" />
                    {segments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={hoveredIndex === idx ? "7.5" : "6"}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        transform={`rotate(${seg.angle} 50 50)`}
                        className="transition-all duration-350 cursor-pointer origin-center"
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    ))}
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                    <p className="text-[7.5px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
                      {hoveredIndex !== null ? segments[hoveredIndex].category : 'Total'}
                    </p>
                    <p className="text-xs font-bold text-white leading-none">
                      {formatCurrency(hoveredIndex !== null ? segments[hoveredIndex].amount : totalMonthlySpend)}
                    </p>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-1 w-full max-h-32 overflow-y-auto pr-1">
                  {segments.map((seg, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                        hoveredIndex === idx ? 'bg-white/[0.02]' : ''
                      }`}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                        <span className="text-zinc-400 truncate max-w-[80px]">{seg.category}</span>
                      </div>
                      <span className="text-zinc-200 font-bold">{seg.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upcoming Renewals Timeline (Subtle right column structure) */}
        <div className="space-y-4">
          <h3 className="layout-label text-white">Upcoming Target Bill Dates</h3>
          <div className="space-y-3.5 py-1">
            {upcomingRenewals.length === 0 ? (
              <div className="text-zinc-500 text-xs font-semibold py-4">No upcoming bill telemetry.</div>
            ) : (
              upcomingRenewals.map((sub) => (
                <div key={sub._id} className="relative pl-5 border-l border-white/[0.04] pb-1 last:pb-0">
                  <div className="absolute left-[-2.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div>
                      <h4 className="text-zinc-200">{sub.serviceName}</h4>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wider">
                        {new Date(sub.nextBillingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-150 font-bold">{formatCurrency(sub.amount, sub.currency)}</p>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mt-0.5">
                        {getDaysText(sub.daysRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ─── AI RECOMMENDATIONS ─────────────────────────────────────────────────────── */}
      <div className="page-section">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-white">Optimization Insights</h3>
          </div>
          <button 
            type="button" 
            disabled={insightsLoading}
            onClick={fetchInsights}
            className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
          >
            {insightsLoading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {aiInsights && aiInsights.length > 0 ? (
            aiInsights.map((insight, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 py-3.5 px-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm text-zinc-400 font-medium leading-relaxed"
              >
                <span className="h-5 w-5 rounded-full bg-[var(--surface-3)] border border-[var(--border)] text-[9px] font-bold text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{insight}</span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-zinc-500 italic">No recommendations calculated. Sync ledger database above.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
