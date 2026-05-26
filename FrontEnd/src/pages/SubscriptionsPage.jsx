import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Filter, Trash2, Edit2, Loader2, RefreshCw, MoreVertical, Sparkles, ChevronDown, Copy, Check, ExternalLink, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBrandStyles, getCategoryBadgeColor } from '../utils/brandStyles';
import CategoryPicker from '../components/CategoryPicker';
import ConfirmBanner from '../components/ConfirmBanner';
import { getCancelLink, generateEmailTemplate } from '../utils/cancellationHelpers';

// ─── Main Subscriptions Component ─────────────────────────────────────────────
const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: '', amount: '', currency: 'INR', billingCycle: 'monthly', nextBillingDate: '', category: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [refreshingId, setRefreshingId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [aiCatLoading, setAiCatLoading] = useState(false);
  const [aiCatSuggestion, setAiCatSuggestion] = useState('');
  const [parsingReceipt, setParsingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeCancelSub, setActiveCancelSub] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  // Inline delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteFromCancelModal, setDeleteFromCancelModal] = useState(false);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch subs', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerBudgetSync = () => {
    window.dispatchEvent(new CustomEvent('budget-update'));
  };

  useEffect(() => { 
    fetchSubs(); 

    const handleOpenAdd = () => {
      setEditingSub(null);
      setAiCatSuggestion('');
      setFormData({ serviceName: '', amount: '', currency: 'INR', billingCycle: 'monthly', nextBillingDate: '', category: '' });
      setShowModal(true);
    };
    window.addEventListener('open-add-subscription', handleOpenAdd);
    return () => window.removeEventListener('open-add-subscription', handleOpenAdd);
  }, []);

  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleServiceNameBlur = async () => {
    if (!formData.serviceName.trim() || editingSub) return;
    try {
      setAiCatLoading(true);
      setAiCatSuggestion('');
      const res = await api.post('/ai/categorize', { serviceName: formData.serviceName.trim() });
      const suggested = res.data.data.category;
      setAiCatSuggestion(suggested);
      if (!formData.category) setFormData(f => ({ ...f, category: suggested }));
    } catch (err) {
      console.error('AI categorization failed', err);
    } finally {
      setAiCatLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setParsingReceipt(true);
        const base64Data = reader.result.split(',')[1];
        const res = await api.post('/ai/parse-invoice', {
          fileData: base64Data,
          mimeType: file.type
        });

        const parsed = res.data.data;
        if (parsed) {
          setFormData(f => ({
            ...f,
            serviceName: parsed.serviceName || f.serviceName,
            amount: parsed.amount !== undefined ? parsed.amount : f.amount,
            currency: parsed.currency || f.currency,
            billingCycle: parsed.billingCycle || f.billingCycle,
            nextBillingDate: parsed.nextBillingDate ? parsed.nextBillingDate.split('T')[0] : f.nextBillingDate
          }));

          if (parsed.serviceName) {
            try {
              setAiCatLoading(true);
              const catRes = await api.post('/ai/categorize', { serviceName: parsed.serviceName });
              setAiCatSuggestion(catRes.data.data.category);
              setFormData(f => ({ ...f, category: catRes.data.data.category }));
            } catch (err) {
              console.error('Categorization error after invoice parse', err);
            } finally {
              setAiCatLoading(false);
            }
          }
        }
      } catch (err) {
        setReceiptError(err.response?.data?.message || 'Failed to parse receipt. Please try a clearer image.');
      } finally {
        setParsingReceipt(false);
      }
    };
    reader.onerror = () => {
      setReceiptError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingSub(null);
    setAiCatSuggestion('');
    setFormError('');
    setReceiptError('');
    setFormData({ serviceName: '', amount: '', currency: 'INR', billingCycle: 'monthly', nextBillingDate: '', category: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      setSubmitting(true);
      const payload = {
        serviceName: formData.serviceName,
        amount: formData.amount,
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        nextBillingDate: formData.nextBillingDate,
        manualCategory: formData.category,
      };
      if (editingSub) {
        await api.put(`/subscriptions/${editingSub._id}`, payload);
      } else {
        await api.post('/subscriptions', payload);
      }
      resetModal();
      triggerBudgetSync();
      fetchSubs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save subscription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async (id) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      triggerBudgetSync();
      fetchSubs();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleRefreshPricing = async (e, serviceName, id) => {
    e.stopPropagation();
    try {
      setRefreshingId(id);
      const res = await api.post(`/pricing/refresh/${serviceName}`);
      const plans = res.data.data.availablePlans;
      // No alert — just log and close menu. UI could be extended with a toast here.
      if (plans && plans.length > 0) {
        console.log(`Refreshed pricing for ${serviceName}:`, plans[0]);
      }
    } catch (err) {
      console.error('Failed to refresh pricing.', err);
    } finally {
      setRefreshingId(null);
      setActiveMenuId(null);
    }
  };

  const formatCurrency = (val, currencyCode = 'INR') => {
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val || 0);
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || sub.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* ─── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 page-header">
        <div className="space-y-1">
          <span className="layout-label">Subscription Ledger</span>
          <h1 className="display-section text-white">Subscriptions</h1>
          <p className="text-[var(--text-2)] text-sm font-medium mt-1">Manage and track your active recurring payments.</p>
        </div>
        <button
          onClick={() => { setEditingSub(null); setAiCatSuggestion(''); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-100 active:scale-95 transition-all text-xs cursor-pointer shadow-sm button-tactile shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" /> Add Subscription
        </button>
      </div>

      {/* ─── FILTERS ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search active subscriptions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/40 border border-white/[0.03] rounded-xl py-3 pl-11 pr-4 focus:ring-1 focus:ring-[var(--accent)]/40 outline-none text-sm font-semibold text-zinc-200 transition-all placeholder:text-zinc-500"
          />
        </div>
        <div className="relative shrink-0">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="appearance-none bg-zinc-950/40 border border-white/[0.03] text-zinc-200 hover:text-white font-bold rounded-xl py-3 pl-10 pr-10 focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer transition-colors text-sm"
          >
            <option value="All" className="bg-[#121316] text-[#f5f5f5]">All Categories</option>
            {Array.from(new Set(subscriptions.map(s => s.category))).map(cat => (
              <option key={cat} value={cat} className="bg-[#121316] text-[#f5f5f5]">{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* ─── INLINE DELETE CONFIRMATION ───────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <ConfirmBanner
            message="Delete this subscription? This action cannot be undone."
            onConfirm={() => handleDeleteConfirmed(deleteConfirmId)}
            onCancel={() => setDeleteConfirmId(null)}
            confirmText="Delete"
            danger
          />
        )}
      </AnimatePresence>

      {/* ─── SUBSCRIPTIONS TABLE ──────────────────────────────────────────────── */}
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="pb-3 pt-4 px-5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Service</th>
              <th className="pb-3 pt-4 px-5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Category</th>
              <th className="pb-3 pt-4 px-5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Amount</th>
              <th className="pb-3 pt-4 px-5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Next Bill</th>
              <th className="pb-3 pt-4 px-5 text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-zinc-800 border-t-[var(--accent)] mx-auto rounded-full"></div>
                </td>
              </tr>
            ) : filteredSubs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-zinc-600 text-xs font-semibold">
                  {subscriptions.length === 0 ? 'No subscriptions yet. Create your first tracker above.' : 'No results match your filter.'}
                </td>
              </tr>
            ) : (
              filteredSubs.map(sub => {
                const brand = getBrandStyles(sub.serviceName);
                return (
                  <tr key={sub._id} className="group hover:bg-[var(--surface-3)] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0 ${brand.bg}`}>
                          {brand.icon}
                        </div>
                        <span className="font-semibold text-zinc-200 text-sm">{sub.serviceName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(sub.category)}`}>
                        {sub.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium">
                      <span className="text-white font-semibold">{formatCurrency(sub.amount, sub.currency)}</span>
                      <span className="text-zinc-500 text-[10px] uppercase font-medium ml-2 tracking-wide">{sub.billingCycle}</span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-zinc-400 font-medium">
                      {new Date(sub.nextBillingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingSub(sub);
                            setAiCatSuggestion('');
                            setFormError('');
                            setFormData({
                              serviceName: sub.serviceName,
                              amount: sub.amount,
                              currency: sub.currency || 'INR',
                              billingCycle: sub.billingCycle,
                              nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : '',
                              category: sub.category || '',
                            });
                            setShowModal(true);
                          }}
                          className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(sub._id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === sub._id ? null : sub._id)}
                            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                          {activeMenuId === sub._id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-[#141416] border border-white/[0.04] z-[60] overflow-hidden">
                              <button
                                onClick={(e) => handleRefreshPricing(e, sub.serviceName, sub._id)}
                                className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800/40 hover:text-white flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                              >
                                {refreshingId === sub._id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                                  : <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />}
                                Refresh Pricing (AI)
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCancelSub(sub);
                                  setShowCancelModal(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-zinc-800/40 hover:text-rose-300 flex items-center gap-2 font-semibold transition-colors border-t border-white/[0.02] cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                                Cancellation Help
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
      {/* ─── ADD / EDIT FORM MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-sm" 
              onClick={resetModal}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative rounded-[1.5rem] w-full max-w-md shadow-2xl p-8 max-h-[95vh] overflow-y-auto z-10 cinematic-glass"
            >
              <button 
                onClick={resetModal}
                className="absolute top-6 right-6 p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">
                {editingSub ? 'Configure Tracker' : 'Initiate Tracker'}
              </h3>
              <p className="text-zinc-500 text-xs font-semibold mb-6">
                Fill active transaction details below.
              </p>

              {/* Receipt upload (new subs only) */}
              {!editingSub && (
                <div className="mb-6">
                  <div className="p-4 bg-zinc-950/40 border border-dashed border-white/[0.04] rounded-xl text-center relative group hover:border-[var(--accent)]/40 transition-all cursor-pointer">
                    {parsingReceipt ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin mb-2" />
                        <p className="text-[10px] font-bold text-zinc-300">Extracting receipt credentials...</p>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleReceiptUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <Sparkles className="h-4 w-4 text-[var(--accent)] mx-auto mb-2 animate-pulse" />
                        <p className="text-[11px] font-bold text-zinc-300">Upload Invoice Receipt (AI Autofill)</p>
                      </>
                    )}
                  </div>
                  {receiptError && (
                    <p className="mt-2 text-[10px] text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 shrink-0" />{receiptError}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Global form error */}
                {formError && (
                  <div className="flex items-center gap-2 bg-rose-500/8 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-[10px] font-bold">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{formError}
                  </div>
                )}

                {/* Service Name */}
                <div className="space-y-1.5">
                  <label htmlFor="sub-service-name" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Service Name</label>
                  <div className="relative">
                    <input
                      id="sub-service-name"
                      required
                      type="text"
                      value={formData.serviceName}
                      onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                      onBlur={handleServiceNameBlur}
                      className="w-full input-cinematic pr-12"
                      placeholder="e.g. Spotify, Notion..."
                    />
                    {aiCatLoading && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <Sparkles className="h-4 w-4 text-[var(--accent)] animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid row: currency / amount / cycle */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="sub-currency" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Currency</label>
                    <div className="relative">
                      <select
                        id="sub-currency"
                        value={formData.currency}
                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full appearance-none bg-zinc-950/60 border border-white/[0.04] text-zinc-200 rounded-xl pl-3 pr-8 py-3 text-sm font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer"
                      >
                        <option value="INR" className="bg-[#121316] text-[#f5f5f5]">INR (₹)</option>
                        <option value="USD" className="bg-[#121316] text-[#f5f5f5]">USD ($)</option>
                        <option value="EUR" className="bg-[#121316] text-[#f5f5f5]">EUR (€)</option>
                        <option value="GBP" className="bg-[#121316] text-[#f5f5f5]">GBP (£)</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="sub-amount" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Amount</label>
                    <input
                      id="sub-amount"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full input-cinematic py-3 text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="sub-cycle" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Cycle</label>
                    <div className="relative">
                      <select
                        id="sub-cycle"
                        value={formData.billingCycle}
                        onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                        className="w-full appearance-none bg-zinc-950/60 border border-white/[0.04] text-zinc-200 rounded-xl pl-3 pr-8 py-3 text-sm font-semibold focus:ring-1 focus:ring-[var(--accent)]/40 outline-none cursor-pointer"
                      >
                        <option value="monthly" className="bg-[#121316] text-[#f5f5f5]">Monthly</option>
                        <option value="yearly" className="bg-[#121316] text-[#f5f5f5]">Yearly</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Billing Date */}
                <div className="space-y-1.5">
                  <label htmlFor="sub-next-billing" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Next Billing Date</label>
                  <input
                    id="sub-next-billing"
                    required
                    type="date"
                    value={formData.nextBillingDate}
                    onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value })}
                    className="w-full bg-zinc-950/60 border border-white/[0.04] text-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-1 focus:ring-[var(--accent)]/45 outline-none [color-scheme:dark]"
                  />
                </div>

                {/* Category picker */}
                <CategoryPicker
                  value={formData.category}
                  onChange={cat => setFormData({ ...formData, category: cat })}
                  aiSuggestion={aiCatSuggestion}
                  aiLoading={aiCatLoading}
                />

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.02] justify-end">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="py-3 px-6 bg-zinc-900 border border-white/[0.02] text-zinc-400 font-bold rounded-xl hover:text-white hover:bg-zinc-800 transition-colors text-xs cursor-pointer button-tactile"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || parsingReceipt}
                    className="py-3 px-6 bg-zinc-100 text-zinc-950 font-bold rounded-xl hover:scale-[1.01] active:scale-95 transition-all text-xs disabled:opacity-50 cursor-pointer button-tactile"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-950" />
                    ) : parsingReceipt ? (
                      'Syncing...'
                    ) : (
                      editingSub ? 'Update' : 'Initiate Tracker'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CANCELLATION HELP MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCancelModal && activeCancelSub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-sm" 
              onClick={() => { setShowCancelModal(false); setDeleteFromCancelModal(false); }}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative rounded-[1.5rem] w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto z-10 cinematic-glass"
            >
              <button 
                onClick={() => { setShowCancelModal(false); setDeleteFromCancelModal(false); }}
                className="absolute top-6 right-6 p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-400" /> Cancellation Assistant
              </h3>
              <p className="text-zinc-500 text-xs font-semibold mb-6">
                Termination instructions for <strong>{activeCancelSub.serviceName}</strong>.
              </p>

              <div className="space-y-6">
                
                {/* Cost layout */}
                <div className="bg-zinc-950/40 border border-white/[0.03] rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Subscription</span>
                    <h4 className="font-bold text-white mt-0.5">{activeCancelSub.serviceName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Charge rate</span>
                    <p className="font-bold text-white mt-0.5">
                      {formatCurrency(activeCancelSub.amount, activeCancelSub.currency)} / {activeCancelSub.billingCycle}
                    </p>
                  </div>
                </div>

                {/* Direct Link */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Step 1: Direct portal termination</h4>
                  <a
                    href={getCancelLink(activeCancelSub.serviceName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#09090b] border border-white/[0.04] text-zinc-300 font-bold rounded-xl hover:text-white transition-all text-xs"
                  >
                    Open Cancellation Settings Page <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Draft Copy */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Step 2: Formal support email</h4>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generateEmailTemplate(activeCancelSub));
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }}
                      className="text-xs font-bold text-[var(--accent)] hover:opacity-85 transition-opacity flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedEmail ? (
                        <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Email</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copy Template</>
                      )}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generateEmailTemplate(activeCancelSub)}
                    rows="6"
                    className="w-full bg-zinc-950/60 border border-white/[0.04] rounded-xl p-4 text-[10px] font-mono text-zinc-400 leading-relaxed resize-none focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/[0.02] space-y-3">
                  <AnimatePresence>
                    {deleteFromCancelModal && (
                      <ConfirmBanner
                        message={`Terminate and permanently delete ${activeCancelSub.serviceName}?`}
                        onConfirm={async () => {
                          await handleDeleteConfirmed(activeCancelSub._id);
                          setShowCancelModal(false);
                          setDeleteFromCancelModal(false);
                        }}
                        onCancel={() => setDeleteFromCancelModal(false)}
                        confirmText="Terminate"
                        danger
                      />
                    )}
                  </AnimatePresence>
                  
                  {!deleteFromCancelModal && (
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowCancelModal(false); setDeleteFromCancelModal(false); }}
                        className="py-3 px-6 bg-zinc-900 border border-white/[0.02] text-zinc-400 font-bold rounded-xl hover:text-white transition-colors text-xs cursor-pointer button-tactile"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteFromCancelModal(true)}
                        className="py-3 px-6 bg-rose-900/80 hover:bg-rose-800 text-white font-bold rounded-xl transition-colors text-xs cursor-pointer button-tactile"
                      >
                        Terminate &amp; Remove Tracker
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionsPage;
