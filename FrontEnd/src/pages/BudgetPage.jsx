import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Target, Edit2, Loader2, Trash2, Plus, ChevronDown } from 'lucide-react';
import { PREDEFINED_CATEGORIES } from '../utils/categories';

const BudgetPage = () => {
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [catLimit, setCatLimit] = useState('');

  const fetchData = async () => {
    try {
      const [budgetRes, analyticsRes] = await Promise.all([
        api.get('/budget'),
        api.get('/analytics')
      ]);
      setBudgetLimit(budgetRes.data.data.budgetLimit || 0);
      setTempBudget(budgetRes.data.data.budgetLimit || 0);
      setCategoryBudgets(budgetRes.data.data.categoryBudgets || []);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch budget data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerBudgetSync = () => {
    // Notify SaaSLayout to re-evaluate warning state
    window.dispatchEvent(new CustomEvent('budget-update'));
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (isNaN(tempBudget) || Number(tempBudget) < 0) return;
    
    try {
      setSaving(true);
      await api.put('/budget', { budgetLimit: Number(tempBudget) });
      setBudgetLimit(Number(tempBudget));
      setIsEditing(false);
      triggerBudgetSync();
      fetchData();
    } catch (err) {
      console.error('Failed to update budget', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategoryBudget = async (e) => {
    e.preventDefault();
    const finalCategoryName = selectedCategory === 'Other' ? customCategory.trim() : selectedCategory;
    if (!finalCategoryName || isNaN(catLimit) || Number(catLimit) <= 0) {
      alert('Please provide a valid category name and limit amount');
      return;
    }

    const updatedBudgets = [...categoryBudgets];
    const index = updatedBudgets.findIndex(b => b.category.toLowerCase() === finalCategoryName.toLowerCase());
    if (index > -1) {
      updatedBudgets[index].limit = Number(catLimit);
    } else {
      updatedBudgets.push({ category: finalCategoryName, limit: Number(catLimit) });
    }

    try {
      setSaving(true);
      await api.put('/budget', { categoryBudgets: updatedBudgets });
      setCategoryBudgets(updatedBudgets);
      setCatLimit('');
      if (selectedCategory === 'Other') {
        setCustomCategory('');
      }
      triggerBudgetSync();
      fetchData();
    } catch (err) {
      console.error('Failed to update category budget', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategoryBudget = async (catName) => {
    const updatedBudgets = categoryBudgets.filter(b => b.category.toLowerCase() !== catName.toLowerCase());
    try {
      setSaving(true);
      await api.put('/budget', { categoryBudgets: updatedBudgets });
      setCategoryBudgets(updatedBudgets);
      triggerBudgetSync();
      fetchData();
    } catch (err) {
      console.error('Failed to delete category budget', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    const currencyCode = analytics?.preferredCurrency || 'INR';
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val || 0);
  };

  const getCategorySpend = (catName) => {
    const found = analytics?.categoryBreakdown?.find(c => c.category.toLowerCase() === catName.toLowerCase());
    return found ? found.amount : 0;
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-[var(--accent)]" /></div>;
  }

  const totalSpend = analytics?.totalMonthlySpend || 0;
  const percentage = budgetLimit > 0 ? (totalSpend / budgetLimit) * 100 : 0;
  
  let status = 'safe';
  if (percentage >= 100) status = 'exceeded';
  else if (percentage >= 80) status = 'warning';

  return (
    <div className="max-w-4xl space-y-8 mx-auto pb-12">
      
      {/* ─── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <span className="layout-label block mb-1">Allowance Boundaries</span>
        <h1 className="display-section text-white">Budget</h1>
        <p className="text-[var(--text-2)] text-sm font-medium mt-1.5">Set your monthly spending limits and track category budgets.</p>
      </div>

      {/* ─── BUDGET OVERVIEW SECTION ───────────────────────────────────────────── */}
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* allowance input */}
          <div className="md:col-span-2 space-y-3 self-center">
          <div className="flex items-center gap-2 text-zinc-500">
            <Target className="h-4 w-4 text-[var(--accent)]" />
            <span className="layout-label">Limit Allowance</span>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateBudget} className="flex flex-col gap-2">
              <input 
                autoFocus
                type="number" 
                min="0"
                value={tempBudget}
                onChange={e => setTempBudget(e.target.value)}
                className="w-full bg-zinc-950/60 border border-white/[0.04] rounded-lg py-2.5 px-3 text-sm font-bold text-white focus:ring-1 focus:ring-[var(--accent)]/40 outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 font-bold hover:text-white transition-colors text-[10px] cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-1.5 rounded-lg bg-[var(--accent)] text-zinc-950 font-bold hover:opacity-90 transition-opacity text-[10px] cursor-pointer">Save</button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="layout-metric text-white leading-none">{formatCurrency(budgetLimit)}</h2>
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-2 rounded-lg bg-zinc-950/50 hover:bg-zinc-800/40 text-zinc-500 hover:text-zinc-200 transition-colors border border-white/[0.03] cursor-pointer"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* progress meters */}
        <div className="md:col-span-3 space-y-4 self-center py-2">
          <div className="flex justify-between items-baseline">
            <span className="layout-label">Active Spending</span>
            <span className={`text-xs font-bold ${status === 'exceeded' ? 'text-rose-400' : 'text-[var(--accent)]'}`}>
              {percentage.toFixed(0)}% used
            </span>
          </div>

          {/* Locked Flat color variable, NO gradient */}
          <div className="w-full h-1 bg-zinc-900 border border-white/[0.02] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 bg-[var(--accent)]"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="text-[10px] font-semibold text-zinc-500">
            {status === 'safe' && <span>Within allowance safety boundaries.</span>}
            {status === 'warning' && <span className="text-amber-500 font-bold">Approach warning threshold boundaries.</span>}
            {status === 'exceeded' && <span className="text-rose-500 font-bold">Warning: Combined recurring expense exceeds limit.</span>}
          </div>
        </div>

        </div>
      </div>

      {/* ─── MINI METRICS ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-stat">
          <span className="layout-label block mb-2">Budget Remaining</span>
          <p className="text-base font-bold text-zinc-100">
            {budgetLimit === 0 ? 'No limit set' : formatCurrency(Math.max(budgetLimit - totalSpend, 0))}
          </p>
        </div>
        <div className="card-stat">
          <span className="layout-label block mb-2">Total Trackers</span>
          <p className="text-base font-bold text-zinc-100">{analytics?.totalSubscriptions || 0} subscriptions</p>
        </div>
        <div className="card-stat">
          <span className="layout-label block mb-2">Monthly Spend</span>
          <p className="text-base font-bold text-zinc-100">{formatCurrency(totalSpend)}</p>
        </div>
      </div>

      {/* ─── CATEGORY BUDGETS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 items-start">
        
        {/* Set budget limit form */}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-5 space-y-4 lg:col-span-1">
          <div>
            <h3 className="layout-label text-white">Segment Ceiling</h3>
            <p className="text-zinc-400 text-xs font-medium mt-1">Enforce boundaries on individual segments.</p>
          </div>
          
          <form onSubmit={handleSaveCategoryBudget} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="budget-category" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
              <div className="relative">
                <select
                  id="budget-category"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none bg-zinc-950/60 border border-white/[0.04] text-zinc-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer"
                >
                  {PREDEFINED_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#121316] text-[#f5f5f5]">{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {selectedCategory === 'Other' && (
              <div className="space-y-1.5">
                <label htmlFor="budget-custom-category" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Custom Category Name</label>
                <input
                  id="budget-custom-category"
                  required
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Type category label..."
                  className="w-full bg-zinc-950/60 border border-white/[0.04] text-zinc-100 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="budget-limit-amount" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Ceiling limit</label>
              <input
                id="budget-limit-amount"
                required
                type="number"
                min="1"
                value={catLimit}
                onChange={e => setCatLimit(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full bg-zinc-950/60 border border-white/[0.04] text-zinc-100 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
            >
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Save Ceiling Limit
            </button>
          </form>
        </div>

        {/* Categories limits progress bar */}
        <div className="lg:col-span-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Category Limits</h3>
            <p className="text-[var(--text-2)] text-xs font-medium mt-0.5">Spending vs limit per category.</p>
          </div>

          <div className="flex flex-col gap-3">
            {categoryBudgets.length === 0 ? (
              <div className="py-6 text-zinc-600 text-xs font-semibold">No active segment ceilings.</div>
            ) : (
              categoryBudgets.map(cb => {
                const spend = getCategorySpend(cb.category);
                const percent = cb.limit > 0 ? (spend / cb.limit) * 100 : 0;
                let catStatus = 'safe';
                if (percent >= 100) catStatus = 'exceeded';
                else if (percent >= 80) catStatus = 'warning';

                return (
                  <div key={cb.category} className="flex flex-col gap-2 py-3.5 border-b border-[var(--border-subtle)] last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-zinc-200 text-xs">{cb.category}</h4>
                        <span className="text-[10px] font-semibold text-zinc-500 block mt-0.5">
                          {formatCurrency(spend)} used of {formatCurrency(cb.limit)} limit
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                          catStatus === 'exceeded' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          catStatus === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          {percent.toFixed(0)}%
                        </span>
                        
                        <button
                          onClick={() => handleDeleteCategoryBudget(cb.category)}
                          className="p-1 text-zinc-600 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-1 bg-zinc-900 border border-white/[0.01] rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          catStatus === 'exceeded' ? 'bg-rose-500' :
                          catStatus === 'warning' ? 'bg-amber-500' :
                          'bg-[var(--accent)]'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default BudgetPage;
